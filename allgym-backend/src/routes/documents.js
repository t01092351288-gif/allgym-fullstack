// 문서 리더기 API: 관리자가 올린 문서를 역할별로 열람
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { query } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError');

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

// 확장자 → 저장/응답에 쓸 MIME 타입 (SVG·HTML 등 스크립트가 들어갈 수 있는 형식은 제외)
const ALLOWED = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  defParamCharset: 'utf8', // 한글 파일명
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (_req, _res, next, id) => {
  if (!UUID_RE.test(id)) return next(new ApiError(404, 'NOT_FOUND', '문서를 찾을 수 없습니다'));
  next();
});

// 역할별로 볼 수 있는 audience
function visibleAudiences(role) {
  if (role === 'ADMIN') return ['ALL', 'TRAINER', 'ADMIN'];
  if (role === 'TRAINER') return ['ALL', 'TRAINER'];
  return ['ALL'];
}

// 목록
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.id, d.title, d.file_name, d.mime_type, d.size_bytes, d.audience, d.created_at,
              u.name AS uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.audience = ANY($1)
       ORDER BY d.created_at DESC`,
      [visibleAudiences(req.user.role)]
    );
    ok(res, rows);
  } catch (e) {
    next(e);
  }
});

// 메타데이터
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, title, file_name, mime_type, size_bytes, audience, created_at
       FROM documents WHERE id=$1 AND audience = ANY($2)`,
      [req.params.id, visibleAudiences(req.user.role)]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND', '문서를 찾을 수 없습니다');
    ok(res, rows[0]);
  } catch (e) {
    next(e);
  }
});

// 파일 내용
router.get('/:id/file', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT file_name, mime_type, content FROM documents WHERE id=$1 AND audience = ANY($2)`,
      [req.params.id, visibleAudiences(req.user.role)]
    );
    if (rows.length === 0) throw new ApiError(404, 'NOT_FOUND', '문서를 찾을 수 없습니다');
    const doc = rows[0];
    res.set({
      'Content-Type': doc.mime_type,
      'Content-Length': doc.content.length,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`,
      'Content-Security-Policy': "sandbox; default-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store', // 역할이 바뀌어도 이전 권한으로 캐시된 파일이 보이지 않도록
    });
    res.send(doc.content);
  } catch (e) {
    next(e);
  }
});

// 업로드 (관리자)
router.post(
  '/',
  requireRole('ADMIN'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(413, 'FILE_TOO_LARGE', '파일은 20MB 이하만 올릴 수 있습니다'));
      }
      if (err) return next(new ApiError(400, 'UPLOAD_FAILED', '파일 업로드에 실패했습니다'));
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) throw new ApiError(400, 'BAD_REQUEST', '파일이 필요합니다');
      const fileName = path.basename(req.file.originalname);
      const mimeType = ALLOWED[path.extname(fileName).toLowerCase()];
      if (!mimeType) {
        throw new ApiError(400, 'UNSUPPORTED_TYPE', '지원 형식: PDF, DOCX, TXT, MD, PNG, JPG, GIF, WEBP');
      }
      const audience = ['ALL', 'TRAINER', 'ADMIN'].includes(req.body.audience) ? req.body.audience : 'ALL';
      const title = (req.body.title || '').trim() || fileName.replace(/\.[^.]+$/, '');

      const { rows } = await query(
        `INSERT INTO documents (title, file_name, mime_type, size_bytes, content, audience, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, title, file_name, mime_type, size_bytes, audience, created_at`,
        [title, fileName, mimeType, req.file.size, req.file.buffer, audience, req.user.id]
      );
      ok(res, rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

// 삭제 (관리자)
router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM documents WHERE id=$1`, [req.params.id]);
    if (rowCount === 0) throw new ApiError(404, 'NOT_FOUND', '문서를 찾을 수 없습니다');
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
