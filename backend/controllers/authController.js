const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const register = async (req, res) => {
  const { email, password, role, fullName, organizationName, organizationType } = req.body;

  if (!['student', 'organization'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );
    const userId = userResult.insertId;

    if (role === 'student') {
      await connection.query(
        'INSERT INTO student_profiles (user_id, full_name, education_level) VALUES (?, ?, ?)',
        [userId, fullName, 'undergraduate']
      );
    } else if (role === 'organization') {
      await connection.query(
        'INSERT INTO organizations (user_id, name, type) VALUES (?, ?, ?)',
        [userId, organizationName, organizationType || 'company']
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Registered successfully', userId, role });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { register, login };
