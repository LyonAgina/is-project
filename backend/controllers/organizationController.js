const pool = require('../db');

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT org.*, u.email FROM organizations org JOIN users u ON org.user_id = u.id WHERE org.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  const { name, type, description, website, location } = req.body;
  try {
    await pool.query(
      `UPDATE organizations SET name = ?, type = ?, description = ?, website = ?, location = ? WHERE user_id = ?`,
      [name, type, description, website, location, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const createOpportunity = async (req, res) => {
  const { title, category, description, minEducation, minAcademicGrade, minExperience, location, deadline, tagIds, minimumMatchScore } = req.body;
  const connection = await pool.getConnection();
  try {
    const [[org]] = await connection.query('SELECT id, verification_status FROM organizations WHERE user_id = ?', [req.user.id]);
    if (org.verification_status !== 'verified') {
      connection.release();
      return res.status(403).json({ error: 'Organization must be verified before posting opportunities' });
    }

    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO opportunities (organization_id, title, category, description, min_education, min_academic_grade, min_experience, location, deadline, status, minimum_match_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [org.id, title, category, description, minEducation || null, minAcademicGrade || null, minExperience || 0, location, deadline || null, minimumMatchScore || null]
    );

    if (Array.isArray(tagIds)) {
      for (const tagId of tagIds) {
        await connection.query('INSERT INTO opportunity_tags (opportunity_id, tag_id) VALUES (?, ?)', [result.insertId, tagId]);
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Opportunity posted', id: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create opportunity' });
  } finally {
    connection.release();
  }
};

const getMyOpportunities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.* FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE org.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

const updateOpportunityStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query(`
      UPDATE opportunities o
      JOIN organizations org ON o.organization_id = org.id
      SET o.status = ?
      WHERE o.id = ? AND org.user_id = ?
    `, [status, req.params.id, req.user.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    await pool.query(`
      DELETE o FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE o.id = ? AND org.user_id = ?
    `, [req.params.id, req.user.id]);
    res.json({ message: 'Opportunity deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
};

const getApplicants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.status, a.applied_at, sp.full_name, sp.institution, sp.cv_url, sp.cv_filename,
             sp.education_level, sp.academic_grade, sp.experience_years, sp.location,
             u.email, ms.total_score, ms.text_similarity_score, ms.skills_score,
             ms.education_score, ms.location_score, ms.experience_score, ms.interest_score
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN organizations org ON o.organization_id = org.id
      LEFT JOIN match_scores ms ON ms.student_id = sp.id AND ms.opportunity_id = a.opportunity_id
      WHERE a.opportunity_id = ? AND org.user_id = ?
      ORDER BY ms.total_score DESC, a.applied_at DESC
    `, [req.params.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
};

const sendApplicationStatusEmail = require('../utils/sendApplicationStatusEmail');

const updateApplicationStatus = async (req, res) => {
  const { status, message } = req.body;
  const validStatuses = ['submitted', 'under_review', 'accepted', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const DEFAULT_MESSAGES = {
    under_review: 'Your application is currently under review. We will get back to you soon.',
    accepted: 'Congratulations! Your application has been accepted.',
    rejected: 'Thank you for applying. Unfortunately, your application was not successful at this time.',
    submitted: 'Your application has been received.',
  };

  try {
    const [[app]] = await pool.query(`
      SELECT a.id, a.student_id, a.status AS old_status, u.email
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN organizations org ON o.organization_id = org.id
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE a.id = ? AND org.user_id = ?
    `, [req.params.appId, req.user.id]);

    if (!app) return res.status(404).json({ error: 'Application not found' });

    await pool.query(`
      UPDATE applications SET status = ?, status_updated_at = NOW() WHERE id = ?
    `, [status, req.params.appId]);

    const notifMessage = (message && message.trim()) ? message.trim() : DEFAULT_MESSAGES[status];

    await pool.query(
      'INSERT INTO notifications (student_id, message, type) VALUES (?, ?, ?)',
      [app.student_id, notifMessage, 'application']
    );

    try {
      await sendApplicationStatusEmail(app.email, status, notifMessage);
    } catch (emailErr) {
      console.error('Failed to send application status email:', emailErr);
    }

    res.json({ message: 'Application status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update application' });
  }
};

const getOrgReports = async (req, res) => {
  try {
    // Opportunities broken down by status (treat past-deadline as expired)
    const [oppsByStatus] = await pool.query(`
      SELECT
        CASE WHEN deadline IS NOT NULL AND deadline < CURDATE() THEN 'expired' ELSE status END AS label,
        COUNT(*) AS count
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE org.user_id = ?
      GROUP BY label
    `, [req.user.id]);

    // Opportunities broken down by category
    const [oppsByCategory] = await pool.query(`
      SELECT category AS label, COUNT(*) AS count
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE org.user_id = ?
      GROUP BY category
    `, [req.user.id]);

    // Application status breakdown across all org opportunities
    const [appsByStatus] = await pool.query(`
      SELECT a.status AS label, COUNT(*) AS count
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN organizations org ON o.organization_id = org.id
      WHERE org.user_id = ?
      GROUP BY a.status
    `, [req.user.id]);

    // Monthly applications received over the last 6 months
    const [monthlyApplications] = await pool.query(`
      SELECT DATE_FORMAT(a.applied_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN organizations org ON o.organization_id = org.id
      WHERE org.user_id = ?
        AND a.applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `, [req.user.id]);

    // Top opportunities by applicant count (up to 8)
    const [topOpportunities] = await pool.query(`
      SELECT o.title, COUNT(a.id) AS applicants
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      LEFT JOIN applications a ON a.opportunity_id = o.id
      WHERE org.user_id = ?
      GROUP BY o.id, o.title
      ORDER BY applicants DESC
      LIMIT 8
    `, [req.user.id]);

    res.json({ oppsByStatus, oppsByCategory, appsByStatus, monthlyApplications, topOpportunities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
};

const sendOrgMessageEmail = require('../utils/sendOrgMessageEmail');

// Send to one student directly
const sendMessageToStudent = async (req, res) => {
  const { studentId, message } = req.body;
  if (!studentId || !message?.trim()) {
    return res.status(400).json({ error: 'studentId and message are required' });
  }

  try {
    const [[org]] = await pool.query('SELECT id, name FROM organizations WHERE user_id = ?', [req.user.id]);
    const [[student]] = await pool.query(
      'SELECT sp.id, u.email FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.id = ?',
      [studentId]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await pool.query(
      'INSERT INTO notifications (student_id, message, type, sent_by_org_id) VALUES (?, ?, ?, ?)',
      [studentId, message.trim(), 'org_message', org.id]
    );

    try {
      await sendOrgMessageEmail(student.email, org.name, message.trim());
    } catch (emailErr) {
      console.error('Failed to send org message email:', emailErr);
    }

    res.json({ message: 'Message sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Broadcast to all applicants of one opportunity
const sendMessageToApplicants = async (req, res) => {
  const { opportunityId, message } = req.body;
  if (!opportunityId || !message?.trim()) {
    return res.status(400).json({ error: 'opportunityId and message are required' });
  }

  try {
    const [[org]] = await pool.query('SELECT id, name FROM organizations WHERE user_id = ?', [req.user.id]);

    const [applicants] = await pool.query(`
      SELECT sp.id AS student_id, u.email
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.opportunity_id = ? AND o.organization_id = ?
    `, [opportunityId, org.id]);

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found for this opportunity' });
    }

    for (const applicant of applicants) {
      await pool.query(
        'INSERT INTO notifications (student_id, message, type, sent_by_org_id) VALUES (?, ?, ?, ?)',
        [applicant.student_id, message.trim(), 'org_message', org.id]
      );
      try {
        await sendOrgMessageEmail(applicant.email, org.name, message.trim());
      } catch (emailErr) {
        console.error(`Failed to email ${applicant.email}:`, emailErr);
      }
    }

    res.json({ message: `Message sent to ${applicants.length} applicant(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send broadcast message' });
  }
};

module.exports = {
  getProfile, updateProfile, createOpportunity, getMyOpportunities,
  updateOpportunityStatus, deleteOpportunity, getApplicants, updateApplicationStatus,
  getOrgReports, sendMessageToStudent, sendMessageToApplicants,
};