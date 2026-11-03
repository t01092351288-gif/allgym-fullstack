// 배포 시작 때 실행: DB가 비어 있을 때만 샘플 데이터를 넣음 (기존 데이터는 절대 지우지 않음)
require('dotenv').config();
const { execFileSync } = require('child_process');
const path = require('path');
const { pool } = require('../config/db');

(async () => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
    await pool.end();
    if (rows[0].n > 0) {
      console.log('ℹ️  데이터가 있어 샘플 데이터 넣기를 건너뜁니다');
      return;
    }
    execFileSync(process.execPath, [path.join(__dirname, 'seed.js')], { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ seed-if-empty failed', e);
    process.exit(1);
  }
})();
