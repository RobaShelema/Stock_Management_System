const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT c.id, c.code, c.name, c.store_id, s.name AS store_name, c.created_at
     FROM categories c JOIN stores s ON s.id = c.store_id
     ORDER BY c.created_at DESC`
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { code, name, storeId } = req.body;
  if (!code || !name || !storeId) throw new ApiError(400, "code, name, and storeId are required.");

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO categories (code, name, store_id) VALUES ($1, $2, $3) RETURNING *`,
      [code, name, storeId]
    );
    await logAction(client, { user: req.user, module: "Item Categories", action: `Created category ${code} — ${name}` });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

module.exports = { list, create };
