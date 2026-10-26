const router = require('express').Router();
const { query } = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');

// 대시보드
router.get('/dashboard', requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows: byBranch } = await query(
      `SELECT b.id, b.name,
              COUNT(r.*) FILTER (WHERE r.status IN ('PENDING','CONFIRMED')) AS today_count,
              COUNT(r.*) FILTER (WHERE r.status = 'CANCELLED') AS cancelled,
              COUNT(r.*) AS total
       FROM branches b
       LEFT JOIN time_slots s ON s.branch_id = b.id AND s.slot_date = $1
       LEFT JOIN reservations r ON r.slot_id = s.id
       GROUP BY b.id, b.name
       ORDER BY b.name`,
      [today]
    );
    const { rows: pending } = await query(
      `SELECT COUNT(*)::int AS n FROM reservations WHERE status='PENDING'`
    );
    const { rows: popular } = await query(
      `SELECT s.start_time, COUNT(*)::int AS cnt
       FROM reservations r JOIN time_slots s ON s.id = r.slot_id
       WHERE r.status IN ('PENDING','CONFIRMED','COMPLETED')
       GROUP BY s.start_time ORDER BY cnt DESC LIMIT 5`
    );
    ok(res, { byBranch, pendingApprovals: pending[0].n, popularSlots: popular });
  } catch (e) {
    next(e);
  }
});

// 트레이너 목록 / 등록 / 수정
router.get('/trainers', requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.bio, t.is_active, t.branch_id, b.name AS branch_name,
              u.id AS user_id, u.name, u.phone
       FROM trainers t
       JOIN users u ON u.id = t.user_id
       JOIN branches b ON b.id = t.branch_id
       ORDER BY u.name`
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post('/trainers', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, phone, branchId, bio } = req.body || {};
    if (!name || !phone || !branchId) throw new ApiError(400, 'BAD_REQUEST');
    const u = await query(
      `INSERT INTO users (name, phone, role) VALUES ($1,$2,'TRAINER') RETURNING *`,
      [name, phone]
    );
    const t = await query(
      `INSERT INTO trainers (user_id, branch_id, bio) VALUES ($1,$2,$3) RETURNING *`,
      [u.rows[0].id, branchId, bio || null]
    );
    ok(res, { user: u.rows[0], trainer: t.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.patch('/trainers/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { bio, isActive, branchId } = req.body || {};
    const { rows } = await query(
      `UPDATE trainers SET
         bio = COALESCE($1, bio),
         is_active = COALESCE($2, is_active),
         branch_id = COALESCE($3, branch_id)
       WHERE id=$4 RETURNING *`,
      [bio ?? null, typeof isActive === 'boolean' ? isActive : null, branchId ?? null, req.params.id]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND');
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
});

// 슬롯 일괄 생성
router.post('/slots/bulk', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { branchId, trainerId, startDate, endDate, openTime = '06:00', closeTime = '21:30' } = req.body || {};
    if (!branchId || !startDate || !endDate) throw new ApiError(400, 'BAD_REQUEST');
    let count = 0;
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const [oh, om] = openTime.split(':').map(Number);
      const [ch, cm] = closeTime.split(':').map(Number);
      for (let m = oh * 60 + om; m < ch * 60 + cm; m += 30) {
        const h = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const eh = String(Math.floor((m + 30) / 60)).padStart(2, '0');
        const em = String((m + 30) % 60).padStart(2, '0');
        await query(
          `INSERT INTO time_slots (branch_id, trainer_id, slot_date, start_time, end_time)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [branchId, trainerId || null, dateStr, `${h}:${mm}`, `${eh}:${em}`]
        );
        count++;
      }
    }
    ok(res, { generated: count });
  } catch (e) {
    next(e);
  }
});

// 슬롯 잠금/해제
router.patch('/slots/:id/lock', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { locked } = req.body || {};
    const { rows } = await query(
      `UPDATE time_slots SET status=$1 WHERE id=$2 RETURNING *`,
      [locked ? 'BLOCKED' : 'OPEN', req.params.id]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND');
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
});

// 통계
router.get('/stats', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const { rows: monthly } = await query(
      `SELECT to_char(s.slot_date, 'YYYY-MM-DD') AS day,
              COUNT(r.*) FILTER (WHERE r.status IN ('CONFIRMED','COMPLETED'))::int AS confirmed,
              COUNT(r.*) FILTER (WHERE r.status = 'CANCELLED')::int AS cancelled
       FROM time_slots s LEFT JOIN reservations r ON r.slot_id = s.id
       WHERE to_char(s.slot_date,'YYYY-MM') = $1
       GROUP BY day ORDER BY day`,
      [month]
    );
    const { rows: popular } = await query(
      `SELECT s.start_time, COUNT(*)::int AS cnt
       FROM reservations r JOIN time_slots s ON s.id = r.slot_id
       WHERE r.status IN ('PENDING','CONFIRMED','COMPLETED')
         AND to_char(s.slot_date,'YYYY-MM') = $1
       GROUP BY s.start_time ORDER BY cnt DESC LIMIT 5`,
      [month]
    );
    ok(res, { month, monthly, popular });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
