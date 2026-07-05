const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(to, otp) {
  await transporter.sendMail({
    from: `"Opportunity Platform" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Verify your email</h2>
        <p style="color:#555;">Enter the code below to activate your account. It expires in 15 minutes.</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;font-size:40px;font-weight:700;letter-spacing:12px;background:#f5f5f5;border-radius:12px;padding:16px 28px;color:#111;">
            ${otp}
          </span>
        </div>
        <p style="color:#999;font-size:12px;">
          If you did not register on the Opportunity Platform, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
