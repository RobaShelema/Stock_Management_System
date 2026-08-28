const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT il.id, il.item_id, i.name AS item_name, il.store_id, s.name AS store_name, il.bin, il.updated_at
     FROM item_locations il
     JOIN items i ON i.id = il.item_id
     JOIN stores s ON s.id = il.store_id
     ORDER BY il.updated_at DESC`
  );
  res.json(rows.rows);
}

async function upsert(req, res) {
  const { itemId, storeId, bin } = req.body;
  if (!itemId || !storeId || !bin) throw new ApiError(400, "itemId, storeId, and bin are required.");

  const result = await withTransaction(async (client) => {
    const upserted = await client.query(
      `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()
       RETURNING *`,
      [itemId, storeId, bin]
    );
    await logAction(client, { user: req.user, module: "Item Locations", action: `Updated location for item to bin ${bin}` });
    return upserted.rows[0];
  });

  res.status(201).json(result);
}

module.exports = { list, upsert };
