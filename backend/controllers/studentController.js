const pool = require('../db');
const upload = require('../middleware/upload');

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sp.*, u.email FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const [tags] = await pool.query(
      `SELECT t.id, t.name, t.type FROM student_tags st JOIN tags t ON st.tag_id = t.id WHERE st.student_id = ?`,
      [rows[0].id]
    );
    res.json({ ...rows[0], tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  const { fullName, institution, courseOfStudy, educationLevel, academicGrade, experienceYears, location, bio, cvUrl, tagIds } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
  `   UPDATE student_profiles
      SET full_name = ?, institution = ?, course_of_study = ?, education_level = ?, academic_grade = ?, experience_years = ?, location = ?, bio = ?, cv_url = ?
      WHERE user_id = ?`,
    [fullName, institution, courseOfStudy, educationLevel, academicGrade || null, experienceYears || 0, location, bio, cvUrl, req.user.id]
    );

    const [[profile]] = await connection.query('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);

    if (Array.isArray(tagIds)) {
      await connection.query('DELETE FROM student_tags WHERE student_id = ?', [profile.id]);
      for (const tagId of tagIds) {
        await connection.query('INSERT INTO student_tags (student_id, tag_id) VALUES (?, ?)', [profile.id, tagId]);
      }
    }

    await connection.commit();
    res.json({ message: 'Profile updated' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    connection.release();
  }
};

const browseOpportunities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.title, o.category, o.description, o.location, o.deadline, org.name AS organization_name
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE o.status = 'active'
      ORDER BY o.deadline ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

const applyToOpportunity = async (req, res) => {
  const { opportunityId } = req.body;
  try {
    const [[profile]] = await pool.query('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);
    await pool.query('INSERT INTO applications (student_id, opportunity_id) VALUES (?, ?)', [profile.id, opportunityId]);
    res.status(201).json({ message: 'Application submitted' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You already applied to this opportunity' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to apply' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.status, a.applied_at, o.title, o.category, o.deadline, org.name AS organization_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      JOIN organizations org ON o.organization_id = org.id
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE sp.user_id = ?
      ORDER BY a.applied_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT n.id, n.message, n.is_read, n.sent_at
      FROM notifications n
      JOIN student_profiles sp ON n.student_id = sp.id
      WHERE sp.user_id = ?
      ORDER BY n.sent_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await pool.query(`
      UPDATE notifications n
      JOIN student_profiles sp ON n.student_id = sp.id
      SET n.is_read = 1
      WHERE n.id = ? AND sp.user_id = ?
    `, [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

const uploadCv = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const cvUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query('UPDATE student_profiles SET cv_url = ? WHERE user_id = ?', [cvUrl, req.user.id]);
    res.json({ message: 'CV uploaded', cvUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save CV' });
  }
};

module.exports = {
  getProfile, updateProfile, browseOpportunities, applyToOpportunity,
  getMyApplications, getNotifications, markNotificationRead, uploadCv
};