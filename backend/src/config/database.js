import mysql from 'mysql2/promise';
import config from './index.js';

const url = new URL(config.databaseUrl);

export const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1) || undefined,
  ssl: url.searchParams.get('sslmode') === 'DISABLED' ? false : { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
  dateStrings: false,
  charset: 'utf8mb4',
});

export async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
