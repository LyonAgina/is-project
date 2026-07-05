const transporter = require('../config/email');

async function sendPasswordResetEmail(toEmail, token) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Fursa" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset your Fursa password',
    html: `
      <p>We received a request to reset your Fursa password.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 30 minutes.</p>
      <p>If you didn't request this, you can ignore this email — your password won't change.</p>
    `,
  });
}

module.exports = sendPasswordResetEmail;