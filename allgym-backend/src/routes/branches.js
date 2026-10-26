const router = require('express').Router();
const { query } = require('../config/db');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');

// 지점 목록
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, location, phone, is_active FROM branches WHERE is_active = true ORDER BY name`
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

// 특정 지점 + 날짜의 슬롯 조회
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = req.query.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'INVALID_DATE', 'date=YYYY-MM-DD 형식이 필요합니다');
    }
    const { rows } = await query(
      `
      SELECT s.id, s.start_time, s.end_time, s.status, s.max_capacity, s.trainer_id,
             u.name AS trainer_name,
             (SELECT COUNT(*) FROM reservations r
                WHERE r.slot_id=s.id AND r.status IN ('PENDING','CONFIRMED')) AS booked
      FROM time_slots s
      LEFT JOIN trainers t ON t.id = s.trainer_id
      LEFT JOIN users u    ON u.id = t.user_id
      WHERE s.branch_id=$1 AND s.slot_date=$2
      ORDER BY s.start_time
      `,
      [id, date]
    );

    const result = rows.map((r) => {
      const booked = Number(r.booked);
      let status = r.status;
      if (status === 'OPEN' && booked >= r.max_capacity) status = 'FULL';
      return {
        id: r.id,
        start: r.start_time,
        end: r.end_time,
        status,
        booked,
        capacity: r.max_capacity,
        trainerId: r.trainer_id,
        trainerName: r.trainer_name,
      };
    });

    ok(res, result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
