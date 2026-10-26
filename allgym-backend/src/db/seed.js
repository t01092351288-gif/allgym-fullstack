require('dotenv').config();
const { pool, query } = require('../config/db');

async function seed() {
  await query('TRUNCATE notifications, customer_memos, reservations, time_slots, trainers, users, branches RESTART IDENTITY CASCADE');

  const { rows: branches } = await query(
    `INSERT INTO branches (name, location, phone) VALUES
     ('사하 올짐','부산광역시 사하구 괴정동','051-000-0001'),
     ('범천 아카이브 올짐','부산광역시 중구','051-000-0002')
     RETURNING id, name`
  );

  const { rows: admins } = await query(
    `INSERT INTO users (name, phone, role) VALUES
     ('대표 관리자','010-0000-0000','ADMIN')
     RETURNING id`
  );

  const trainerUsers = await query(
    `INSERT INTO users (name, phone, role) VALUES
     ('김PT','010-1111-1111','TRAINER'),
     ('이코치','010-1111-2222','TRAINER'),
     ('박트레이너','010-1111-3333','TRAINER')
     RETURNING id, name`
  );

  const trainers = await query(
    `INSERT INTO trainers (user_id, branch_id, bio) VALUES
     ($1,$2,'헬스 · 다이어트 전문'),
     ($3,$2,'필라테스 · 재활 전문'),
     ($4,$5,'근력 · 컨디셔닝')
     RETURNING id`,
    [trainerUsers.rows[0].id, branches[0].id, trainerUsers.rows[1].id, trainerUsers.rows[2].id, branches[1].id]
  );

  const customers = await query(
    `INSERT INTO users (name, phone, role) VALUES
     ('홍길동','010-2222-1111','CUSTOMER'),
     ('김민지','010-2222-2222','CUSTOMER')
     RETURNING id`
  );

  // 오늘 + 7일치 슬롯 생성 (06:00 ~ 21:30, 30분 단위)
  const slotInsert = [];
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const dt = new Date(today);
    dt.setDate(today.getDate() + d);
    const dateStr = dt.toISOString().slice(0, 10);

    for (let m = 6 * 60; m < 21 * 60 + 30; m += 30) {
      const startH = String(Math.floor(m / 60)).padStart(2, '0');
      const startM = String(m % 60).padStart(2, '0');
      const endMins = m + 30;
      const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
      const endM = String(endMins % 60).padStart(2, '0');
      const start = `${startH}:${startM}`;
      const end = `${endH}:${endM}`;
      slotInsert.push([branches[0].id, trainers.rows[0].id, dateStr, start, end]);
      slotInsert.push([branches[1].id, trainers.rows[2].id, dateStr, start, end]);
    }
  }

  for (const row of slotInsert) {
    await query(
      `INSERT INTO time_slots (branch_id, trainer_id, slot_date, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      row
    );
  }

  // 샘플 예약 3건
  const { rows: someSlots } = await query(
    `SELECT id FROM time_slots ORDER BY slot_date, start_time LIMIT 3`
  );
  for (const s of someSlots) {
    await query(
      `INSERT INTO reservations (user_id, slot_id, status) VALUES ($1,$2,'PENDING')`,
      [customers.rows[0].id, s.id]
    );
  }

  console.log('✅ seed done');
  console.log('관리자:', admins[0].id);
  console.log('지점:', branches.map((b) => b.name).join(', '));
  console.log('트레이너:', trainers.rows.length, '명');
  console.log('고객:', customers.rows.length, '명');
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
