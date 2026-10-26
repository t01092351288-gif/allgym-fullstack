require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'sql', 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ migrate done');
    process.exit(0);
  } catch (e) {
    console.error('❌ migrate failed', e);
    process.exit(1);
  }
})();
