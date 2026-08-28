const bcrypt = require("bcryptjs");
const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");
const { ROLES } = require("../config/roles");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT id, name, email, role, store_id, department, status, created_at FROM users ORDER BY created_at DESC`,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { name, email, role, password, storeId, department } = req.body;
  if (!name || !email || !role)
    throw new ApiError(400, "name, email, and role are required.");
  if (!ROLES.includes(role))
    throw new ApiError(400, `Unsupported user role: ${role}.`);

  const passwordHash = await bcrypt.hash(password || "Demo@1234", 10);

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO users (name, email, password_hash, role, store_id, department) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, passwordHash, role, storeId || null, department || null],
    );
    await logAction(client, {
      user: req.user,
      module: "Users & Roles",
      action: `Registered user ${email} as ${role}`,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function toggleStatus(req, res) {
  const { id } = req.params;

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT status, email FROM users WHERE id = $1`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "User not found.");

    const newStatus =
      current.rows[0].status === "Active" ? "Inactive" : "Active";
    const updated = await client.query(
      `UPDATE users SET status = $1, updated_at = now() WHERE id = $2
       RETURNING id, name, email, role, status`,
      [newStatus, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Users & Roles",
      action: `Set user ${current.rows[0].email} status to ${newStatus}`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

async function update(req, res) {
  const { id } = req.params;
  const { name, email, role, password, storeId, department } = req.body;

  if (!name || !email || !role) {
    throw new ApiError(400, "name, email, and role are required.");
  }
  if (!ROLES.includes(role))
    throw new ApiError(400, `Unsupported user role: ${role}.`);

  const result = await withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [id],
    );
    if (existing.rows.length === 0) throw new ApiError(404, "User not found.");

    let query = `UPDATE users SET name = $1, email = $2, role = $3, store_id = $4, department = $5, updated_at = now() WHERE id = $6 RETURNING id, name, email, role, store_id, department, status, updated_at`;
    let params = [name, email, role, storeId || null, department || null, id];

    if (password && password.trim().length > 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      query = `UPDATE users SET name = $1, email = $2, role = $3, store_id = $4, department = $5, password_hash = $6, updated_at = now() WHERE id = $7 RETURNING id, name, email, role, store_id, department, status, updated_at`;
      params = [
        name,
        email,
        role,
        storeId || null,
        department || null,
        passwordHash,
        id,
      ];
    }

    const updated = await client.query(query, params);
    await logAction(client, {
      user: req.user,
      module: "Users & Roles",
      action: `Updated user account ${email} (Role: ${role})`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, update, toggleStatus };
