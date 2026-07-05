const transporter = require('../config/email');

async function sendVerificationEmail(toEmail, token) {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Fursa" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Verify your Fursa account',
    html: `
      <p>Welcome to Fursa!</p>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyLink}">${verifyLink}</a>
      <p>This link expires in 30 minutes.</p>
      <p>If you didn't create this account, you can ignore this email.</p>
    `,
  });
}

module.exports = sendVerificationEmail;