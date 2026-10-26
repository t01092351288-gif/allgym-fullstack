const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const kakao = require('../services/kakao');
const { redisClient } = require('../config/redis');

// ── 1. 전화번호 인증 코드 발송 (개발용: 랜덤 6자리, Redis 5분 보관)
router.post('/phone/send', async (req, res, next) => {
  try {
    const { phone } = req.body || {};
    if (!phone || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)) {
      throw new ApiError(400, 'INVALID_PHONE', '휴대폰 번호 형식이 올바르지 않습니다');
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await redisClient.set(`oljim:phone:${phone}`, code, { EX: 300 });
    // 운영: CoolSMS 발송. 개발: 코드 자체를 응답으로 반환
    ok(res, { code: process.env.NODE_ENV === 'production' ? undefined : code, expiresIn: 300 });
  } catch (e) {
    next(e);
  }
});

// ── 2. 전화번호 인증 확인 → 세션 발급
router.post('/phone/verify', async (req, res, next) => {
  try {
    const { phone, code, name } = req.body || {};
    if (!phone || !code) throw new ApiError(400, 'BAD_REQUEST', '필수 값이 누락되었습니다');
    const saved = await redisClient.get(`oljim:phone:${phone}`);
    // 개발 편의: 인증코드가 '000000'이면 통과
    if (saved !== code && code !== '000000') {
      throw new ApiError(400, 'CODE_MISMATCH', '인증 코드가 올바르지 않습니다');
    }
    await redisClient.del(`oljim:phone:${phone}`);

    let { rows } = await query(`SELECT * FROM users WHERE phone=$1`, [phone]);
    let user = rows[0];
    if (!user) {
      const ins = await query(
        `INSERT INTO users (name, phone, role) VALUES ($1,$2,'CUSTOMER') RETURNING *`,
        [name || `회원${phone.slice(-4)}`, phone]
      );
      user = ins.rows[0];
    }

    req.session.user = { id: user.id, name: user.name, role: user.role };
    ok(res, { user: req.session.user });
  } catch (e) {
    next(e);
  }
});

// ── 3. 카카오 OAuth 시작
router.get('/kakao', async (req, res, next) => {
  try {
    if (!kakao.isEnabled()) {
      if (!kakao.fallbackEnabled()) {
        throw new ApiError(501, 'KAKAO_DISABLED', '카카오 키가 설정되지 않았습니다');
      }
      // 폴백: 가상의 카카오 사용자로 즉시 로그인
      const fakeId = `dev-${uuid().slice(0, 8)}`;
      let { rows } = await query(`SELECT * FROM users WHERE kakao_id=$1`, [fakeId]);
      let user = rows[0];
      if (!user) {
        const ins = await query(
          `INSERT INTO users (name, kakao_id, role) VALUES ($1,$2,'CUSTOMER') RETURNING *`,
          [`테스트회원_${fakeId.slice(-4)}`, fakeId]
        );
        user = ins.rows[0];
      }
      req.session.user = { id: user.id, name: user.name, role: user.role };
      const redirect = (process.env.WEB_BASE_URL || 'http://localhost:3000') + '/login/callback?fallback=1';
      return res.redirect(redirect);
    }
    const state = uuid();
    req.session.kakaoState = state;
    res.redirect(kakao.getAuthorizeUrl(state));
  } catch (e) {
    next(e);
  }
});

// ── 4. 카카오 OAuth 콜백
router.get('/kakao/callback', async (req, res, next) => {
  try {
    if (!kakao.isEnabled()) throw new ApiError(501, 'KAKAO_DISABLED', '카카오 로그인 비활성');
    const { code, state } = req.query;
    if (!code) throw new ApiError(400, 'BAD_REQUEST', 'code 누락');
    if (state && req.session.kakaoState && state !== req.session.kakaoState) {
      throw new ApiError(400, 'STATE_MISMATCH', 'state 불일치');
    }
    const token = await kakao.exchangeCodeForToken(code);
    const profile = await kakao.fetchProfile(token.access_token);

    let { rows } = await query(`SELECT * FROM users WHERE kakao_id=$1`, [profile.kakaoId]);
    let user = rows[0];
    if (!user) {
      const ins = await query(
        `INSERT INTO users (name, kakao_id, role) VALUES ($1,$2,'CUSTOMER') RETURNING *`,
        [profile.nickname, profile.kakaoId]
      );
      user = ins.rows[0];
    }
    req.session.user = { id: user.id, name: user.name, role: user.role };
    const redirect = (process.env.WEB_BASE_URL || 'http://localhost:3000') + '/login/callback';
    res.redirect(redirect);
  } catch (e) {
    next(e);
  }
});

// ── 5. 내 정보
router.get('/me', (req, res) => ok(res, { user: req.session?.user || null }));

// ── 6. 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ── 7. (개발용) 역할 변경: 트레이너/관리자 데모용
router.post('/dev/switch-role', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') throw new ApiError(403, 'FORBIDDEN');
    const { role } = req.body || {};
    if (!['CUSTOMER', 'TRAINER', 'ADMIN'].includes(role)) {
      throw new ApiError(400, 'BAD_ROLE');
    }
    if (!req.session.user) throw new ApiError(401, 'UNAUTHORIZED');
    await query(`UPDATE users SET role=$1 WHERE id=$2`, [role, req.session.user.id]);
    req.session.user.role = role;
    ok(res, { user: req.session.user });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
