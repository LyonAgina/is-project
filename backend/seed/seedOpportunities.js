// seedOpportunities.js
//
// Seeds 10 verified organizations and 5 opportunities each (50 total),
// plus supporting users, tags, and opportunity_tags rows.
//
// Usage:
//   node seedOpportunities.js
//
// Requires a .env (or dotenvx-managed) file with your normal DB config:
//   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
//
// Uses the SAME db driver style as the rest of the backend (raw mysql2,
// no ORM). Safe to re-run: organizations/users are looked up by email
// before insert, and tags are looked up by name+type before insert, so
// re-running will not create duplicates of those. Opportunities ARE
// inserted fresh each run (there's no natural unique key on the table
// to dedupe against) -- comment out the run or add your own guard if
// you need strict idempotency there.

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = tryRequireBcrypt();
const { ORGANIZATIONS, OPPORTUNITIES } = require('./data');
const { buildDescription } = require('./describe');

function tryRequireBcrypt() {
  try {
    return require('bcryptjs');
  } catch (e) {
    try {
      return require('bcrypt');
    } catch (e2) {
      console.warn('Neither bcryptjs nor bcrypt is installed. Falling back to a fixed placeholder hash.');
      return null;
    }
  }
}

const SEED_PASSWORD = 'Seed@12345'; // placeholder only -- change before using in a shared/demo env

async function hashPassword() {
  if (!bcrypt) return '$2a$10$placeholderplaceholderplaceholderplaceholderplaceh'; // not a real bcrypt hash
  return bcrypt.hash(SEED_PASSWORD, 10);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD for a `date` column
}

async function getOrCreateUser(conn, { email, role }) {
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return existing[0].id;

  const passwordHash = await hashPassword();
  const [result] = await conn.query(
    `INSERT INTO users (email, password_hash, role, is_active, email_verified)
     VALUES (?, ?, ?, 1, 1)`,
    [email, passwordHash, role]
  );
  return result.insertId;
}

async function getOrCreateTag(conn, name, type, cache) {
  const key = `${type}:${name}`;
  if (cache.has(key)) return cache.get(key);

  const [existing] = await conn.query('SELECT id FROM tags WHERE name = ? AND type = ?', [name, type]);
  if (existing.length > 0) {
    cache.set(key, existing[0].id);
    return existing[0].id;
  }

  const [result] = await conn.query('INSERT INTO tags (name, type) VALUES (?, ?)', [name, type]);
  cache.set(key, result.insertId);
  return result.insertId;
}

async function seedOrganization(conn, orgDef, adminUserId) {
  const orgUserId = await getOrCreateUser(conn, { email: orgDef.email, role: 'organization' });

  const [existingOrg] = await conn.query('SELECT id FROM organizations WHERE user_id = ?', [orgUserId]);
  if (existingOrg.length > 0) {
    console.log(`  - Organization "${orgDef.name}" already exists (id ${existingOrg[0].id}), skipping insert.`);
    return existingOrg[0].id;
  }

  const [result] = await conn.query(
    `INSERT INTO organizations
       (user_id, name, type, description, website, logo_url, location, verification_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      orgUserId,
      orgDef.name,
      orgDef.type,
      orgDef.description,
      orgDef.website,
      `https://placehold.co/200x200?text=${encodeURIComponent(orgDef.name.split(' ')[0])}`,
      orgDef.location,
    ]
  );
  const orgId = result.insertId;

  // Simulate the admin verification step.
  await conn.query(
    `UPDATE organizations SET verification_status = 'verified', verified_by = ?, verified_at = NOW() WHERE id = ?`,
    [adminUserId, orgId]
  );

  console.log(`  - Created + verified organization "${orgDef.name}" (id ${orgId})`);
  return orgId;
}

async function seedOpportunitiesForOrg(conn, orgId, orgDef, opportunityDefs, tagCache) {
  for (const opp of opportunityDefs) {
    const title = `${opp.programType} - ${orgDef.name}`;
    const description = buildDescription({ org: orgDef, opp });

    const [result] = await conn.query(
      `INSERT INTO opportunities
         (organization_id, title, category, description, min_education, min_academic_grade,
          min_experience, location, deadline, status, minimum_match_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        orgId,
        title,
        opp.category,
        description,
        opp.minEducation,
        opp.minGrade,
        opp.minExperience,
        orgDef.location,
        addDays(opp.deadlineDays),
        opp.minimumMatchScore,
      ]
    );
    const oppId = result.insertId;

    const tagIds = [];
    for (const skill of opp.skills) tagIds.push(await getOrCreateTag(conn, skill, 'skill', tagCache));
    for (const interest of opp.interests) tagIds.push(await getOrCreateTag(conn, interest, 'interest', tagCache));

    for (const tagId of tagIds) {
      await conn.query(
        'INSERT IGNORE INTO opportunity_tags (opportunity_id, tag_id) VALUES (?, ?)',
        [oppId, tagId]
      );
    }

    console.log(`    * "${title}" (id ${oppId}) with ${tagIds.length} tags`);
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'is_project',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  const tagCache = new Map();

  try {
    console.log('Ensuring admin user exists for organization verification...');
    const adminUserId = await getOrCreateUser(conn, { email: 'admin@fursa.local', role: 'admin' });
    console.log(`  - Admin user id: ${adminUserId}`);

    for (const orgDef of ORGANIZATIONS) {
      console.log(`\nSeeding organization: ${orgDef.name}`);
      const orgId = await seedOrganization(conn, orgDef, adminUserId);

      const opportunityDefs = OPPORTUNITIES[orgDef.key];
      if (!opportunityDefs) {
        console.warn(`  ! No opportunities defined for key "${orgDef.key}", skipping.`);
        continue;
      }
      await seedOpportunitiesForOrg(conn, orgId, orgDef, opportunityDefs, tagCache);
    }

    console.log('\nSeed complete: 10 organizations, up to 50 opportunities.');
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
