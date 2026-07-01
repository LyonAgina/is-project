const pool = require('../db');

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

const computeAndSaveRecommendations = async (studentUserId) => {
  const [[student]] = await pool.query(
    `SELECT id, education_level, academic_grade, experience_years, location FROM student_profiles WHERE user_id = ?`,
    [studentUserId]
  );
  if (!student) throw new Error('Student profile not found');

  const [studentTagRows] = await pool.query('SELECT st.tag_id, t.type FROM student_tags st JOIN tags t ON st.tag_id = t.id WHERE st.student_id = ?', [student.id]);
  const studentSkillIds = studentTagRows.filter((t) => t.type === 'skill').map((t) => t.tag_id);
  const studentInterestIds = studentTagRows.filter((t) => t.type === 'interest').map((t) => t.tag_id);

  const [opportunities] = await pool.query(`
    SELECT o.id, o.title, o.category, o.min_education, o.min_academic_grade, o.min_experience, o.location, o.deadline, org.name AS organization_name
    FROM opportunities o JOIN organizations org ON o.organization_id = org.id
    WHERE o.status = 'active'
  `);

  if (opportunities.length === 0) return [];

  const oppIds = opportunities.map((o) => o.id);
  const [tagRows] = await pool.query(
    `SELECT ot.opportunity_id, ot.tag_id, t.type FROM opportunity_tags ot JOIN tags t ON ot.tag_id = t.id WHERE ot.opportunity_id IN (?)`,
    [oppIds]
  );

  const results = [];

  for (const opp of opportunities) {
    const reqTags = tagRows.filter((t) => t.opportunity_id === opp.id);
    const reqSkillIds = reqTags.filter((t) => t.type === 'skill').map((t) => t.tag_id);
    const reqInterestIds = reqTags.filter((t) => t.type === 'interest').map((t) => t.tag_id);

    const skillsScore = tagOverlapScore(studentSkillIds, reqSkillIds);
    const interestScore = tagOverlapScore(studentInterestIds, reqInterestIds);
    const eduScore = educationScore(student.education_level, student.academic_grade, opp.min_education, opp.min_academic_grade);
    const locScore = locationScore(student.location, opp.location);
    const expScore = experienceScore(student.experience_years, opp.min_experience);

    const totalScore =
      skillsScore * 0.5 + eduScore * 0.15 + locScore * 0.15 + expScore * 0.1 + interestScore * 0.1;

    await pool.query(
      `INSERT INTO match_scores (student_id, opportunity_id, skills_score, education_score, location_score, experience_score, interest_score, total_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         skills_score = ?, education_score = ?, location_score = ?, experience_score = ?, interest_score = ?, total_score = ?, generated_at = NOW()`,
      [
        student.id, opp.id, skillsScore, eduScore, locScore, expScore, interestScore, totalScore,
        skillsScore, eduScore, locScore, expScore, interestScore, totalScore,
      ]
    );

    results.push({ ...opp, skillsScore, eduScore, locScore, expScore, interestScore, totalScore });
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

module.exports = { getRecommendations };