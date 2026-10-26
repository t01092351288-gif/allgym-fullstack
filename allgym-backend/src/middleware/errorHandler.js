const ApiError = require('../utils/ApiError');

function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details || null },
    });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
  });
}

module.exports = { errorHandler };
