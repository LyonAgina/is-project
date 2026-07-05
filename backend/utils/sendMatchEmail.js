const transporter = require('../config/email');

async function sendMatchEmail(toEmail, opportunity, scorePercent) {
  await transporter.sendMail({
    from: `"Fursa" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `New match: ${opportunity.title} (${scorePercent}%)`,
    html: `
      <p>We found a new opportunity that matches your profile at <strong>${scorePercent}%</strong>:</p>
      <h3>${opportunity.title}</h3>
      <p>${opportunity.organization_name} · ${opportunity.category}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/student/opportunities/${opportunity.id}">View opportunity</a></p>
    `,
  });
}

module.exports = sendMatchEmail;