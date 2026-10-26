const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on('error', (err) => console.error('[pg] pool error', err));

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
