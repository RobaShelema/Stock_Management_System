const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const rows = await pool.query(
    `SELECT id, title, message, module, reference_id, severity, read_at, created_at
     FROM notifications WHERE recipient_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [req.user.id, limit],
  );
  res.json(rows.rows);
}

async function markRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications SET read_at = COALESCE(read_at, now())
     WHERE id = $1 AND recipient_id = $2 RETURNING id, read_at`,
    [req.params.id, req.user.id],
  );
  if (result.rows.length === 0)
    throw new ApiError(404, "Notification not found.");
  res.json(result.rows[0]);
}

async function markAllRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications SET read_at = COALESCE(read_at, now())
     WHERE recipient_id = $1 AND read_at IS NULL`,
    [req.user.id],
  );
  res.json({ updated: result.rowCount });
}

module.exports = { list, markRead, markAllRead };
