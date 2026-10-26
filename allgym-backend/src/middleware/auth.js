// 세션쿠키 기반 인증 미들웨어
const ApiError = require('../utils/ApiError');

function requireAuth(req, _res, next) {
  if (!req.session?.user) {
    return next(new ApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
  }
  req.user = req.session.user;
  next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.session?.user) return next(new ApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다'));
    if (!roles.includes(req.session.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', '권한이 없습니다'));
    }
    req.user = req.session.user;
    next();
  };
}

module.exports = { requireAuth, requireRole };
