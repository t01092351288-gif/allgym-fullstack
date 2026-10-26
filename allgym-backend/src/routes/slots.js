const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');
const { acquireLock, TTL_SECONDS } = require('../services/slotLock');

// 슬롯 임시 잠금 (5분)
router.post('/:id/lock', requireAuth, async (req, res, next) => {
  try {
    const got = await acquireLock(req.params.id, req.user.id);
    if (!got) throw new ApiError(409, 'SLOT_LOCKED', '다른 사용자가 예약 중입니다');
    ok(res, { lockExpiresIn: TTL_SECONDS });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
