const transporter = require('../config/email');

async function sendApplicationStatusEmail(toEmail, status, message) {
  const subjects = {
    accepted: 'Your application was accepted!',
    rejected: 'Update on your application',
    under_review: 'Your application is under review',
    submitted: 'Application received',
  };

  await transporter.sendMail({
    from: `"Fursa" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: subjects[status] || 'Application status update',
    html: `<p>${message}</p><p><a href="${process.env.FRONTEND_URL}/dashboard/student/applications">View your applications</a></p>`,
  });
}

module.exports = sendApplicationStatusEmail;