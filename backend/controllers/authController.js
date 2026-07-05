const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const sendPasswordResetEmail = require('../utils/sendPasswordResetEmail');

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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role, email_verified, verification_token, token_expires_at) VALUES (?, ?, ?, 0, ?, ?)',
      [email, passwordHash, role, verificationToken, tokenExpiresAt]
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

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({
      message: 'Registered successfully. Please check your email to verify your account.',
      userId,
      role,
      email,
    });
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

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
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

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token missing' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, role, token_expires_at FROM users WHERE verification_token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already-used verification link' });
    }

    const user = rows[0];

    if (new Date(user.token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification link expired. Please request a new one.' });
    }

    await pool.query(
      'UPDATE users SET email_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    res.json({ message: 'Email verified successfully.', role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [rows] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.json({ message: 'If that account exists and is unverified, a new link has been sent.' });
    }

    const user = rows[0];

    if (user.email_verified) {
      return res.json({ message: 'If that account exists and is unverified, a new link has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?',
      [verificationToken, tokenExpiresAt, user.id]
    );

    await sendVerificationEmail(email, verificationToken);

    res.json({ message: 'If that account exists and is unverified, a new link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend verification link' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [rows] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);

    // Same response either way — don't reveal whether the email exists
    const genericResponse = { message: 'If that account exists, a password reset link has been sent.' };

    if (rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?',
      [resetToken, resetExpiresAt, user.id]
    );

    await sendPasswordResetEmail(email, resetToken);

    res.json(genericResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, reset_token_expires_at FROM users WHERE reset_token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already-used reset link' });
    }

    const user = rows[0];

    if (new Date(user.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset link expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};