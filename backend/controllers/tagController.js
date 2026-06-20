const pool = require('../db');

const getAllTags = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, type FROM tags ORDER BY type, name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

const findOrCreateTag = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !['skill', 'interest'].includes(type)) {
    return res.status(400).json({ error: 'name and valid type required' });
  }
  try {
    const [existing] = await pool.query('SELECT id, name, type FROM tags WHERE name = ? AND type = ?', [name, type]);
    if (existing.length > 0) return res.json(existing[0]);

    const [result] = await pool.query('INSERT INTO tags (name, type) VALUES (?, ?)', [name, type]);
    res.status(201).json({ id: result.insertId, name, type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

module.exports = { getAllTags, findOrCreateTag };
