// 올짐 백엔드 진입점
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const { redisClient, RedisStore } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// 기본 미들웨어
app.use(helmet());
app.use(
  cors({
    origin: (process.env.WEB_BASE_URL || 'http://localhost:3000').split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 세션 (Redis 기반)
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: 'oljim:sess:' }),
    name: 'oljim.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    },
  })
);

// Rate Limit
app.use(
  '/v1/auth',
  rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
);
app.use(
  '/v1',
  rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);

// 헬스체크
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 라우트
app.use('/v1', routes);

// 에러 핸들러
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
async function start() {
  await redisClient.connect().catch(() => {
    console.warn('[redis] connect failed - lock 기능이 비활성화됩니다');
  });
  app.listen(PORT, () => {
    console.log(`[oljim] listening on http://localhost:${PORT}`);
  });
}
start();
