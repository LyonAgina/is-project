// describe.js
// Builds a realistic, multi-section opportunity description from the
// structured facts in data.js. `opportunities.description` is a single
// TEXT column, so sections are written as plain-text headers + paragraphs.

const EDU_LABEL = {
  certificate: 'a certificate',
  diploma: 'a diploma',
  undergraduate: "a Bachelor's degree",
  graduate: "a Master's degree or higher",
};

const GRADE_LABEL = {
  first_class: 'First Class Honours',
  second_upper: 'Second Class Honours (Upper Division)',
  second_lower: 'Second Class Honours (Lower Division)',
  pass: 'a Pass',
};

function softSkillsFor(skills) {
  const pool = ['Communication', 'Leadership', 'Project Management', 'Business Analysis'];
  return pool.filter((s) => !skills.includes(s)).slice(0, 3).concat(
    skills.includes('Communication') ? [] : ['Communication']
  ).slice(0, 3);
}

function buildDescription({ org, opp }) {
  const { programType, discipline, minEducation, minGrade, minExperience, skills, interests } = opp;
  const soft = softSkillsFor(skills);

  const overview = [
    `Overview`,
    `${org.name} is inviting applications for the ${programType}, an opportunity designed for students and recent graduates in ${discipline} who want hands-on exposure within ${org.sector.toLowerCase()}. Based at ${org.location}, successful candidates will work alongside experienced professionals on real deliverables, gaining direct exposure to how ${org.name} operates and contributes to its sector. This program forms part of ${org.name}'s ongoing commitment to developing early-career talent in Kenya and the wider East African region.`,
  ].join('\n');

  const responsibilities = [
    `Key Responsibilities`,
    `- Support day-to-day activities within the assigned team, contributing to ongoing projects related to ${discipline.toLowerCase()}.`,
    `- Collaborate with cross-functional colleagues to prepare reports, analyses, or deliverables as required.`,
    `- Apply core skills in ${skills.slice(0, 2).join(' and ')} to practical, real-world tasks under supervision.`,
    `- Participate in team meetings, training sessions, and structured feedback reviews throughout the program.`,
    `- Maintain accurate documentation and uphold the organization's standards of professionalism and confidentiality.`,
  ].join('\n');

  const eligibility = [
    `Eligibility Requirements`,
    `- Currently enrolled in, or a recent graduate of, a program in ${discipline}.`,
    `- Kenyan national or holder of a valid work/study permit for Kenya.`,
    `- Available to commit to the full duration of the program without significant interruption.`,
    `- Demonstrated interest in ${org.sector.toLowerCase()} through coursework, prior attachments, or personal projects.`,
  ].join('\n');

  const academic = [
    `Academic Requirements`,
    `Applicants should hold, or be working towards, ${EDU_LABEL[minEducation]} in ${discipline} or a closely related field` +
      (minGrade ? `, with a minimum academic standing of ${GRADE_LABEL[minGrade]}.` : '.') +
      (minExperience > 0
        ? ` A minimum of ${minExperience} year(s) of relevant experience (internships, attachments, or projects) is required.`
        : ` This opportunity is open to candidates with little to no prior professional experience, provided academic performance and demonstrated interest are strong.`),
  ].join('\n');

  const techSkills = [
    `Required Technical Skills`,
    skills.map((s) => `- ${s}`).join('\n'),
  ].join('\n');

  const softSkills = [
    `Preferred Soft Skills`,
    soft.map((s) => `- ${s}`).join('\n'),
  ].join('\n');

  const benefits = [
    `Benefits`,
    `- A structured onboarding and mentorship experience with dedicated supervisors.`,
    `- Exposure to real projects and cross-functional teams within ${org.name}.`,
    `- A stipend or allowance in line with ${org.name}'s internal policy for this program.`,
    `- A certificate of completion and a formal reference upon successful conclusion of the program.`,
    `- For strong performers, potential consideration for future full-time or extended opportunities.`,
  ].join('\n');

  const applicationProcess = [
    `Application Process`,
    `Interested candidates should submit their CV and a short cover note through the Fursa platform. Shortlisted applicants will be contacted for an initial screening interview, followed by a technical or case-based assessment relevant to the ${programType.toLowerCase()}. Final candidates will undergo a panel interview with the hiring team at ${org.name} before an offer is extended.`,
  ].join('\n');

  const importantDates = [
    `Important Dates`,
    `Applications close on the deadline listed on this posting. Shortlisting typically takes place within two weeks of the closing date, with interviews and final placements confirmed shortly thereafter. Candidates are encouraged to apply early, as applications may close before the stated deadline if a strong candidate pool is reached.`,
  ].join('\n');

  const selection = [
    `Selection Criteria`,
    `- Academic performance and relevance of field of study to ${discipline}.`,
    `- Demonstrated proficiency in the required technical skills listed above.`,
    `- Strength of the cover note and clarity of career motivation.`,
    `- Performance at interview and, where applicable, technical assessment stage.`,
  ].join('\n');

  const additional = [
    `Additional Information`,
    `${org.name} is an equal-opportunity organization and welcomes applications from all qualified candidates regardless of gender, ethnicity, or disability status. This opportunity is associated with the following areas of interest: ${interests.join(', ')}. For questions about this posting, candidates may reach out through the official channels listed on the organization's Fursa profile.`,
  ].join('\n');

  return [
    overview, responsibilities, eligibility, academic, techSkills,
    softSkills, benefits, applicationProcess, importantDates, selection, additional,
  ].join('\n\n');
}

module.exports = { buildDescription };
