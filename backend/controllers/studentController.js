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
  const connection = await pool.getConnection();
  try {
    const [[current]] = await connection.query('SELECT * FROM student_profiles WHERE user_id = ?', [req.user.id]);
    if (!current) {
      connection.release();
      return res.status(404).json({ error: 'Profile not found' });
    }

    const merged = {
      fullName: req.body.fullName !== undefined ? req.body.fullName : current.full_name,
      institution: req.body.institution !== undefined ? req.body.institution : current.institution,
      courseOfStudy: req.body.courseOfStudy !== undefined ? req.body.courseOfStudy : current.course_of_study,
      educationLevel: req.body.educationLevel !== undefined ? req.body.educationLevel : current.education_level,
      academicGrade: req.body.academicGrade !== undefined ? req.body.academicGrade : current.academic_grade,
      experienceYears: req.body.experienceYears !== undefined ? req.body.experienceYears : current.experience_years,
      location: req.body.location !== undefined ? req.body.location : current.location,
      bio: req.body.bio !== undefined ? req.body.bio : current.bio,
      cvUrl: req.body.cvUrl !== undefined ? req.body.cvUrl : current.cv_url,
    };

    await connection.beginTransaction();

    await connection.query(
      `UPDATE student_profiles
       SET full_name = ?, institution = ?, course_of_study = ?, education_level = ?, academic_grade = ?, experience_years = ?, location = ?, bio = ?, cv_url = ?
       WHERE user_id = ?`,
      [merged.fullName, merged.institution, merged.courseOfStudy, merged.educationLevel, merged.academicGrade || null, merged.experienceYears || 0, merged.location, merged.bio, merged.cvUrl, req.user.id]
    );

    if (Array.isArray(req.body.tagIds)) {
      await connection.query('DELETE FROM student_tags WHERE student_id = ?', [current.id]);
      for (const tagId of req.body.tagIds) {
        await connection.query('INSERT INTO student_tags (student_id, tag_id) VALUES (?, ?)', [current.id, tagId]);
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
  const { opportunityId, coverNote } = req.body;
  try {
    const [[profile]] = await pool.query('SELECT id, cv_url FROM student_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile.cv_url) {
      return res.status(400).json({ error: 'Please upload your CV before applying', code: 'CV_REQUIRED' });
    }
    await pool.query(
      'INSERT INTO applications (student_id, opportunity_id, cover_note) VALUES (?, ?, ?)',
      [profile.id, opportunityId, coverNote || null]
    );
    res.status(201).json({ message: 'Application submitted' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You already applied to this opportunity' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to apply' });
  }
};

const getOpportunityById = async (req, res) => {
  try {
    const [[opp]] = await pool.query(`
      SELECT o.*, org.name AS organization_name, org.description AS organization_description
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE o.id = ? AND o.status = 'active'
    `, [req.params.id]);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const [tags] = await pool.query(
      `SELECT t.id, t.name, t.type FROM opportunity_tags ot JOIN tags t ON ot.tag_id = t.id WHERE ot.opportunity_id = ?`,
      [req.params.id]
    );
    res.json({ ...opp, tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
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
  const cvFilename = req.file.originalname;
  try {
    await pool.query('UPDATE student_profiles SET cv_url = ?, cv_filename = ? WHERE user_id = ?', [cvUrl, cvFilename, req.user.id]);
    res.json({ message: 'CV uploaded', cvUrl, cvFilename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save CV' });
  }
};

const uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query(
      'UPDATE student_profiles SET profile_picture_url = ? WHERE user_id = ?',
      [avatarUrl, req.user.id]
    );
    res.json({ message: 'Avatar updated', avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save avatar' });
  }
};

module.exports = {
  getProfile, updateProfile, browseOpportunities, applyToOpportunity,
  getMyApplications, getNotifications, markNotificationRead, uploadCv, uploadAvatar, getOpportunityById
};