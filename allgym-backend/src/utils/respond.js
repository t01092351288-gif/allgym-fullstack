function ok(res, data, meta) {
  return res.json({ success: true, data, meta: meta || undefined });
}
module.exports = { ok };
