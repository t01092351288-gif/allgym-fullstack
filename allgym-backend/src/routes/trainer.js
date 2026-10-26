const router = require('express').Router();
const { query } = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');

// 내 시간표 (트레이너 전용)
router.get('/schedule', requireRole('TRAINER'), async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date) throw new ApiError(400, 'INVALID_DATE');

    const t = await query(`SELECT id FROM trainers WHERE user_id=$1`, [req.user.id]);
    if (t.rowCount === 0) throw new ApiError(404, 'TRAINER_NOT_FOUND');

    const { rows } = await query(
      `SELECT s.id AS slot_id, s.start_time, s.end_time,
              r.id AS reservation_id, r.status,
              u.id AS customer_id, u.name AS customer_name, u.phone AS customer_phone
       FROM time_slots s
       LEFT JOIN reservations r ON r.slot_id = s.id AND r.status IN ('PENDING','CONFIRMED')
       LEFT JOIN users u ON u.id = r.user_id
       WHERE s.trainer_id=$1 AND s.slot_date=$2
       ORDER BY s.start_time`,
      [t.rows[0].id, date]
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

// 예약 승인
router.patch('/reservations/:id/approve', requireRole('TRAINER'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE reservations SET status='CONFIRMED', updated_at=now()
       WHERE id=$1 AND status='PENDING' RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) throw new ApiError(409, 'NOT_PENDING');
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
});

// 예약 거절
router.patch('/reservations/:id/reject', requireRole('TRAINER'), async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const { rows } = await query(
      `UPDATE reservations SET status='REJECTED', cancel_reason=$1, updated_at=now()
       WHERE id=$2 AND status='PENDING' RETURNING *`,
      [reason || '트레이너 거절', req.params.id]
    );
    if (rows.length === 0) throw new ApiError(409, 'NOT_PENDING');
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
});

// 고객 메모
router.post('/customers/:id/memo', requireRole('TRAINER'), async (req, res, next) => {
  try {
    const { content } = req.body || {};
    if (!content) throw new ApiError(400, 'CONTENT_REQUIRED');
    const t = await query(`SELECT id FROM trainers WHERE user_id=$1`, [req.user.id]);
    if (t.rowCount === 0) throw new ApiError(404, 'TRAINER_NOT_FOUND');
    const ins = await query(
      `INSERT INTO customer_memos (trainer_id, customer_id, content)
       VALUES ($1,$2,$3) RETURNING *`,
      [t.rows[0].id, req.params.id, content]
    );
    ok(res, ins.rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get('/customers/:id/memos', requireRole('TRAINER'), async (req, res, next) => {
  try {
    const t = await query(`SELECT id FROM trainers WHERE user_id=$1`, [req.user.id]);
    if (t.rowCount === 0) throw new ApiError(404, 'TRAINER_NOT_FOUND');
    const { rows } = await query(
      `SELECT id, content, created_at FROM customer_memos
       WHERE trainer_id=$1 AND customer_id=$2 ORDER BY created_at DESC`,
      [t.rows[0].id, req.params.id]
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
