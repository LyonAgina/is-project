const transporter = require('../config/email');

async function sendOrgMessageEmail(toEmail, orgName, message) {
  await transporter.sendMail({
    from: `"Fursa" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `New message from ${orgName}`,
    html: `<p><strong>${orgName}</strong> sent you a message:</p><p>${message}</p>`,
  });
}

module.exports = sendOrgMessageEmail;