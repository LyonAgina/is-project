const pool = require('../db');

const getStats = async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
        (SELECT COUNT(*) FROM organizations) AS total_organizations,
        (SELECT COUNT(*) FROM organizations WHERE verification_status = 'pending') AS pending_organizations,
        (SELECT COUNT(*) FROM opportunities) AS total_opportunities,
        (SELECT COUNT(*) FROM opportunities WHERE status = 'active') AS active_opportunities,
        (SELECT COUNT(*) FROM opportunities WHERE deadline < CURDATE()) AS expired_opportunities,
        (SELECT COUNT(*) FROM applications) AS total_applications
    `);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getPendingOrganizations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.name, o.type, o.description, o.website, o.location, o.created_at, u.email
       FROM organizations o
       JOIN users u ON o.user_id = u.id
       WHERE o.verification_status = 'pending'
       ORDER BY o.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending organizations' });
  }
};

const verifyOrganization = async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;

  if (!['verified', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be verified or rejected' });
  }

  try {
    await pool.query(
      `UPDATE organizations
       SET verification_status = ?, verified_by = ?, verified_at = NOW()
       WHERE id = ?`,
      [decision, req.user.id, id]
    );
    res.json({ message: `Organization ${decision}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = `SELECT id, email, role, is_active, created_at FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND email LIKE ?`;
      params.push(`%${search}%`);
    }
    if (role && ['student', 'admin', 'organization'].includes(role)) {
      query += ` AND role = ?`;
      params.push(role);
    }
    if (status === 'active') {
      query += ` AND is_active = 1`;
    } else if (status === 'inactive') {
      query += ` AND is_active = 0`;
    }

    query += ` ORDER BY created_at DESC`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const toggleUserActive = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }
  try {
    const [[user]] = await pool.query('SELECT is_active FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [!user.is_active, id]);
    res.json({ message: user.is_active ? 'User deactivated' : 'User activated', is_active: !user.is_active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const sendNotificationToUser = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  try {
    const [[user]] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'student') {
      const [[profile]] = await pool.query(
        `SELECT sp.id FROM student_profiles sp WHERE sp.user_id = ?`, [id]
      );
      if (!profile) return res.status(404).json({ error: 'Student profile not found' });
      await pool.query(
        'INSERT INTO notifications (student_id, message, type) VALUES (?, ?, ?)',
        [profile.id, message.trim(), 'admin']
      );
    } else {
      // organization or admin — use user_id column
      await pool.query(
        'INSERT INTO notifications (student_id, user_id, message, type) VALUES (NULL, ?, ?, ?)',
        [id, message.trim(), 'admin']
      );
    }

    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

const getAllOpportunities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.title, o.category, o.status, o.deadline, o.created_at, org.name AS organization_name
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

const deleteOpportunity = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM opportunities WHERE id = ?', [id]);
    res.json({ message: 'Opportunity deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
};

const deleteExpiredOpportunities = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM opportunities WHERE deadline < CURDATE()');
    res.json({ message: `Deleted ${result.affectedRows} expired opportunities` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expired opportunities' });
  }
};

const getReports = async (req, res) => {
  try {
    // Monthly user registrations for the last 6 months
    const [monthlyRegistrations] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        role,
        COUNT(*) AS count
      FROM users
      WHERE role IN ('student', 'organization')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month, role
      ORDER BY month ASC
    `);

    // Opportunities broken down by category
    const [opportunitiesByCategory] = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM opportunities
      GROUP BY category
    `);

    // Opportunities broken down by status
    const [opportunitiesByStatus] = await pool.query(`
      SELECT
        CASE
          WHEN deadline IS NOT NULL AND deadline < CURDATE() THEN 'expired'
          ELSE status
        END AS label,
        COUNT(*) AS count
      FROM opportunities
      GROUP BY label
    `);

    // Organization verification breakdown
    const [orgVerification] = await pool.query(`
      SELECT verification_status AS label, COUNT(*) AS count
      FROM organizations
      GROUP BY verification_status
    `);

    // Application status breakdown
    const [applicationsByStatus] = await pool.query(`
      SELECT status AS label, COUNT(*) AS count
      FROM applications
      GROUP BY status
    `);

    // Monthly applications for the last 6 months
    const [monthlyApplications] = await pool.query(`
      SELECT
        DATE_FORMAT(applied_at, '%Y-%m') AS month,
        COUNT(*) AS count
      FROM applications
      WHERE applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    res.json({
      monthlyRegistrations,
      opportunitiesByCategory,
      opportunitiesByStatus,
      orgVerification,
      applicationsByStatus,
      monthlyApplications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
};

module.exports = {
  getStats,
  getPendingOrganizations,
  verifyOrganization,
  getAllUsers,
  toggleUserActive,
  deleteUser,
  sendNotificationToUser,
  getAllOpportunities,
  deleteOpportunity,
  deleteExpiredOpportunities,
  getReports,
};