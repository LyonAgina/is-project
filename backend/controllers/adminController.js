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
    const [rows] = await pool.query(
      `SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
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

module.exports = {
  getStats,
  getPendingOrganizations,
  verifyOrganization,
  getAllUsers,
  getAllOpportunities,
  deleteOpportunity,
  deleteExpiredOpportunities,
};