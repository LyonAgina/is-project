require('dotenv').config();
const mysql = require('mysql2/promise');
console.log('Connecting with host:', process.env.DB_HOST, 'db:', process.env.DB_NAME, 'user:', process.env.DB_USER);
mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 5000,
}).then(() => console.log('CONNECTED OK')).catch(e => console.log('CONNECT FAILED:', e.message));
