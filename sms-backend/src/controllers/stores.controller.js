const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT s.id, s.code, s.name, s.type, s.status, s.created_at, u.name AS head_name
     FROM stores s LEFT JOIN users u ON u.id = s.head_user_id
     ORDER BY s.created_at DESC`
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { code, name, type, headUserId } = req.body;
  if (!code || !name || !type) throw new ApiError(400, "code, name, and type are required.");

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO stores (code, name, type, head_user_id) VALUES ($1, $2, $3, $4)
       RETURNING id, code, name, type, status, created_at`,
      [code, name, type, headUserId || null]
    );
    await logAction(client, { user: req.user, module: "Store Setup", action: `Registered store ${code} — ${name}` });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function toggleStatus(req, res) {
  const { id } = req.params;
  const result = await withTransaction(async (client) => {
    const current = await client.query(`SELECT status, code FROM stores WHERE id = $1`, [id]);
    if (current.rows.length === 0) throw new ApiError(404, "Store not found.");
    const newStatus = current.rows[0].status === "Active" ? "Inactive" : "Active";
    const updated = await client.query(`UPDATE stores SET status = $1 WHERE id = $2 RETURNING *`, [newStatus, id]);
    await logAction(client, { user: req.user, module: "Store Setup", action: `Set store ${current.rows[0].code} status to ${newStatus}` });
    return updated.rows[0];
  });
  res.json(result);
}

async function update(req, res) {
  const { id } = req.params;
  const { code, name, type, headUserId } = req.body;
  if (!code || !name || !type) throw new ApiError(400, "code, name, and type are required.");

  const result = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT id, code FROM stores WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new ApiError(404, "Store not found.");

    const updated = await client.query(
      `UPDATE stores SET code = $1, name = $2, type = $3, head_user_id = $4 WHERE id = $5
       RETURNING id, code, name, type, status, created_at`,
      [code, name, type, headUserId || null, id]
    );
    await logAction(client, {
      user: req.user,
      module: "Store Setup",
      action: `Configured store ${code} — ${name}`,
    });
    return updated.rows[0];
  });
  res.json(result);
}

module.exports = { list, create, update, toggleStatus };

