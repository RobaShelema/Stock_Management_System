const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

async function list(req, res) {
  const rows = await pool.query(`SELECT * FROM suppliers ORDER BY created_at DESC`);
  res.json(rows.rows);
}

async function create(req, res) {
  const { name, contact, phone, email } = req.body;
  if (!name) throw new ApiError(400, "name is required.");

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO suppliers (name, contact, phone, email) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, contact || null, phone || null, email || null]
    );
    await logAction(client, { user: req.user, module: "Suppliers", action: `Registered supplier ${name}` });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function toggleStatus(req, res) {
  const { id } = req.params;
  const result = await withTransaction(async (client) => {
    const current = await client.query(`SELECT status, name FROM suppliers WHERE id = $1`, [id]);
    if (current.rows.length === 0) throw new ApiError(404, "Supplier not found.");
    const newStatus = current.rows[0].status === "Active" ? "Inactive" : "Active";
    const updated = await client.query(`UPDATE suppliers SET status = $1 WHERE id = $2 RETURNING *`, [newStatus, id]);
    await logAction(client, { user: req.user, module: "Suppliers", action: `Set supplier ${current.rows[0].name} status to ${newStatus}` });
    return updated.rows[0];
  });
  res.json(result);
}

async function update(req, res) {
  const { id } = req.params;
  const { name, contact, phone, email } = req.body;
  if (!name) throw new ApiError(400, "name is required.");

  const result = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT id, name FROM suppliers WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new ApiError(404, "Supplier not found.");

    const updated = await client.query(
      `UPDATE suppliers SET name = $1, contact = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *`,
      [name, contact || null, phone || null, email || null, id]
    );
    await logAction(client, {
      user: req.user,
      module: "Suppliers",
      action: `Updated supplier details for ${name}`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, update, toggleStatus };

