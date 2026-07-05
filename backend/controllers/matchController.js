const pool = require('../db');
const { textSimilarityScore } = require('../utils/textSimilarity');
const extractCvText = require('../utils/extractCvText');
const sendMatchEmail = require('../utils/sendMatchEmail');

const EDU_RANK = { certificate: 1, diploma: 2, undergraduate: 3, graduate: 4 };
const GRADE_RANK = { pass: 1, second_lower: 2, second_upper: 3, first_class: 4 };

function educationScore(studentLevel, studentGrade, minLevel, minGrade) {
  let levelScore = 100;
  if (minLevel) {
    const sRank = EDU_RANK[studentLevel] || 0;
    const rRank = EDU_RANK[minLevel] || 0;
    levelScore = sRank >= rRank ? 100 : Math.max(0, (sRank / rRank) * 100);
  }
  let gradeScore = 100;
  if (minGrade) {
    const sG = GRADE_RANK[studentGrade] || 0;
    const rG = GRADE_RANK[minGrade] || 0;
    gradeScore = sG >= rG ? 100 : Math.max(0, (sG / rG) * 100);
  }
  if (minLevel && minGrade) return (levelScore + gradeScore) / 2;
  if (minLevel) return levelScore;
  if (minGrade) return gradeScore;
  return 100;
}

function locationScore(studentLoc, oppLoc) {
  if (!oppLoc) return 100;
  if (!studentLoc) return 0;
  const s = studentLoc.trim().toLowerCase();
  const o = oppLoc.trim().toLowerCase();
  if (s === o) return 100;
  if (s.includes(o) || o.includes(s)) return 60;
  return 0;
}

function experienceScore(studentYears, minYears) {
  if (!minYears || minYears <= 0) return 100;
  if (studentYears >= minYears) return 100;
  return Math.max(0, (studentYears / minYears) * 100);
}

function tagOverlapScore(studentTagIds, requiredTagIds) {
  if (!requiredTagIds.length) return 100;
  const overlap = requiredTagIds.filter((id) => studentTagIds.includes(id)).length;
  return (overlap / requiredTagIds.length) * 100;
}

// Fetches everything needed to score ONE student against ONE opportunity,
// computes the weighted total, and upserts into match_scores.
// Returns { totalScore, breakdown }.
async function scoreStudentAgainstOpportunity(studentId, opportunityId) {
  const [[student]] = await pool.query(
    `SELECT id, education_level, academic_grade, experience_years, location, cv_url
     FROM student_profiles WHERE id = ?`,
    [studentId]
  );
  if (!student) throw new Error('Student profile not found');

  const [[opp]] = await pool.query(
    `SELECT id, title, description, min_education, min_academic_grade, min_experience, location
     FROM opportunities WHERE id = ?`,
    [opportunityId]
  );
  if (!opp) throw new Error('Opportunity not found');

  const [studentTagRows] = await pool.query(
    'SELECT st.tag_id, t.type FROM student_tags st JOIN tags t ON st.tag_id = t.id WHERE st.student_id = ?',
    [studentId]
  );
  const studentSkillIds = studentTagRows.filter((t) => t.type === 'skill').map((t) => t.tag_id);
  const studentInterestIds = studentTagRows.filter((t) => t.type === 'interest').map((t) => t.tag_id);

  const [reqTagRows] = await pool.query(
    `SELECT ot.tag_id, t.type FROM opportunity_tags ot JOIN tags t ON ot.tag_id = t.id WHERE ot.opportunity_id = ?`,
    [opportunityId]
  );
  const reqSkillIds = reqTagRows.filter((t) => t.type === 'skill').map((t) => t.tag_id);
  const reqInterestIds = reqTagRows.filter((t) => t.type === 'interest').map((t) => t.tag_id);

  const studentText = await extractCvText(student.cv_url);
  const skillsScore = tagOverlapScore(studentSkillIds, reqSkillIds);
  const interestScore = tagOverlapScore(studentInterestIds, reqInterestIds);
  const eduScore = educationScore(student.education_level, student.academic_grade, opp.min_education, opp.min_academic_grade);
  const locScore = locationScore(student.location, opp.location);
  const expScore = experienceScore(student.experience_years, opp.min_experience);
  const textScore = textSimilarityScore(studentText, opp.description);

  const totalScore =
    textScore * 0.5 +
    skillsScore * 0.1 +
    eduScore * 0.1 +
    locScore * 0.1 +
    expScore * 0.1 +
    interestScore * 0.1;

  await pool.query(
    `INSERT INTO match_scores (student_id, opportunity_id, skills_score, education_score, location_score, experience_score, interest_score, text_similarity_score, total_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       skills_score = ?, education_score = ?, location_score = ?, experience_score = ?, interest_score = ?, text_similarity_score = ?, total_score = ?, generated_at = NOW()`,
    [
      studentId, opportunityId, skillsScore, eduScore, locScore, expScore, interestScore, textScore, totalScore,
      skillsScore, eduScore, locScore, expScore, interestScore, textScore, totalScore,
    ]
  );

  return { totalScore, breakdown: { skillsScore, eduScore, locScore, expScore, interestScore, textScore } };
}

const computeAndSaveRecommendations = async (studentUserId) => {
  const [[student]] = await pool.query(
    `SELECT id, notification_threshold FROM student_profiles WHERE user_id = ?`,
    [studentUserId]
  );
  if (!student) throw new Error('Student profile not found');

  const [[userRow]] = await pool.query('SELECT email FROM users WHERE id = ?', [studentUserId]);

  const [opportunities] = await pool.query(`
    SELECT o.id, o.title, o.category, o.description, o.location, o.deadline, org.name AS organization_name
    FROM opportunities o JOIN organizations org ON o.organization_id = org.id
    WHERE o.status = 'active'
  `);

  if (opportunities.length === 0) return [];

  const [alreadyNotified] = await pool.query(
    `SELECT opportunity_id FROM notifications WHERE student_id = ? AND type = 'match'`,
    [student.id]
  );
  const notifiedOppIds = new Set(alreadyNotified.map((r) => r.opportunity_id));

  const results = [];

  for (const opp of opportunities) {
    const { totalScore, breakdown } = await scoreStudentAgainstOpportunity(student.id, opp.id);

    if (totalScore >= student.notification_threshold && !notifiedOppIds.has(opp.id)) {
      await pool.query(
        'INSERT INTO notifications (student_id, opportunity_id, message, type) VALUES (?, ?, ?, ?)',
        [student.id, opp.id, `New match: ${opp.title} (${Math.round(totalScore)}% match)`, 'match']
      );

      if (userRow?.email) {
        try {
          await sendMatchEmail(userRow.email, opp, Math.round(totalScore));
        } catch (emailErr) {
          console.error('Failed to send match email:', emailErr);
        }
      }
    }

    results.push({ ...opp, ...breakdown, totalScore });
  }

  results.sort((a, b) => b.totalScore - a.totalScore);
  return results;
};

const getRecommendations = async (req, res) => {
  try {
    const results = await computeAndSaveRecommendations(req.user.id);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

module.exports = {
  getRecommendations,
  scoreStudentAgainstOpportunity,
};