const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

async function getForItem(req, res) {
  const { itemId } = req.params;

  const itemRes = await pool.query(`SELECT id, code, name, unit, qty_on_hand FROM items WHERE id = $1`, [itemId]);
  if (itemRes.rows.length === 0) throw new ApiError(404, "Item not found.");

  const entries = await pool.query(
    `SELECT id, type, qty, balance, cost_amount, reference, created_at
     FROM stock_card_entries WHERE item_id = $1 ORDER BY created_at DESC`,
    [itemId]
  );

  res.json({ item: itemRes.rows[0], entries: entries.rows });
}

module.exports = { getForItem };
