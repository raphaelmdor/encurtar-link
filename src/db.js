require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

let pool;

function getPoolConfig() {
  // Railway injeta DATABASE_URL automaticamente
  if (process.env.DATABASE_URL) {
    return { uri: process.env.DATABASE_URL };
  }
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };
}

async function getConnection() {
  if (!pool) {
    const config = getPoolConfig();
    pool = config.uri
      ? mysql.createPool(config.uri)
      : mysql.createPool(config);
  }
  return pool;
}

async function query(sql, params = []) {
  const db = await getConnection();
  const [rows] = await db.execute(sql.replace(/\$(\d+)/g, '?'), params);
  return { rows };
}

async function init() {
  await query(`CREATE TABLE IF NOT EXISTS urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('Banco de dados inicializado.');
}

module.exports = { query, init };
