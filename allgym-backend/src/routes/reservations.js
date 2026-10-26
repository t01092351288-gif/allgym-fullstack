const router = require('express').Router();
const { pool, query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');
const { releaseLock, getLockHolder } = require('../services/slotLock');

// 예약 생성
router.post('/', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { slotId } = req.body || {};
    if (!slotId) throw new ApiError(400, 'BAD_REQUEST', 'slotId 필요');

    // 잠금 검증: 본인 또는 잠금 없는 상태만 진행
    const holder = await getLockHolder(slotId);
    if (holder && holder !== req.user.id) {
      throw new ApiError(409, 'SLOT_LOCKED', '다른 사용자가 예약 중입니다');
    }

    await client.query('BEGIN');
    const slotR = await client.query(
      `SELECT s.*, (SELECT COUNT(*) FROM reservations r
                    WHERE r.slot_id=s.id AND r.status IN ('PENDING','CONFIRMED')) AS booked
       FROM time_slots s WHERE s.id=$1 FOR UPDATE`,
      [slotId]
    );
    if (slotR.rowCount === 0) throw new ApiError(404, 'SLOT_NOT_FOUND');
    const slot = slotR.rows[0];
    if (slot.status === 'BLOCKED' || slot.status === 'CLOSED') {
      throw new ApiError(409, 'SLOT_UNAVAILABLE', '예약 불가 슬롯입니다');
    }
    if (Number(slot.booked) >= slot.max_capacity) {
      throw new ApiError(409, 'SLOT_FULL', '해당 시간은 마감되었습니다');
    }

    const ins = await client.query(
      `INSERT INTO reservations (user_id, slot_id, status)
       VALUES ($1,$2,'PENDING') RETURNING *`,
      [req.user.id, slotId]
    );
    await client.query('COMMIT');
    await releaseLock(slotId, req.user.id);

    ok(res, ins.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e.code === '23505') {
      return next(new ApiError(409, 'ALREADY_BOOKED', '이미 예약된 시간입니다'));
    }
    next(e);
  } finally {
    client.release();
  }
});

// 내 예약 목록
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.id, r.status, r.created_at,
              s.slot_date, s.start_time, s.end_time,
              b.name AS branch_name,
              tu.name AS trainer_name
       FROM reservations r
       JOIN time_slots s ON s.id = r.slot_id
       JOIN branches b ON b.id = s.branch_id
       LEFT JOIN trainers t ON t.id = s.trainer_id
       LEFT JOIN users tu ON tu.id = t.user_id
       WHERE r.user_id=$1
       ORDER BY s.slot_date DESC, s.start_time DESC`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

// 예약 단건 조회
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, s.slot_date, s.start_time, s.end_time, b.name AS branch_name
       FROM reservations r
       JOIN time_slots s ON s.id = r.slot_id
       JOIN branches b ON b.id = s.branch_id
       WHERE r.id=$1`,
      [req.params.id]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND');
    const r = rows[0];
    // 본인 or 관리자만 조회
    if (req.user.role !== 'ADMIN' && r.user_id !== req.user.id) {
      throw new ApiError(403, 'FORBIDDEN');
    }
    ok(res, r);
  } catch (e) {
    next(e);
  }
});

// 예약 취소 (2시간 전 무패널티 기준)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, s.slot_date, s.start_time
       FROM reservations r
       JOIN time_slots s ON s.id = r.slot_id
       WHERE r.id=$1`,
      [req.params.id]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND');
    const r = rows[0];
    if (r.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'FORBIDDEN');
    }
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW', 'REJECTED'].includes(r.status)) {
      throw new ApiError(409, 'NOT_CANCELLABLE', '이미 처리된 예약입니다');
    }

    const slotAt = new Date(`${r.slot_date.toISOString().slice(0, 10)}T${r.start_time}+09:00`);
    const hoursLeft = (slotAt.getTime() - Date.now()) / 36e5;
    const penalty = hoursLeft < 2;

    await query(
      `UPDATE reservations SET status='CANCELLED', cancel_reason=$1, updated_at=now() WHERE id=$2`,
      [penalty ? '당일 취소 (정책상 패널티)' : '정상 취소', req.params.id]
    );
    ok(res, { cancelled: true, penalty });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
