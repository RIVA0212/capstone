const mysql = require('mysql2/promise');
require('dotenv').config(); // ✅ dotenv 불러오기

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'capstone'
  });
  return connection;
}

module.exports = initDB;