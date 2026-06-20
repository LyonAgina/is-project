const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tagRoutes = require('./routes/tagRoutes');
const studentRoutes = require('./routes/studentRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/organization', organizationRoutes);


app.get('/api/health', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 + 1 AS result');
  res.json({ status: 'ok', dbTest: rows[0].result });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
