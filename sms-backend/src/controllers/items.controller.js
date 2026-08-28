const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");
const { receiveLot } = require("../utils/fifo");
const { ensureBinCard, postBinCardEntry } = require("../utils/binCard");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT i.id, i.code, i.name, i.category_id, c.name AS category_name, i.unit, i.type,
            i.reorder_level, i.safety_stock_level, i.qty_on_hand, i.disposal_reserved_qty,
            (i.qty_on_hand - i.disposal_reserved_qty) AS usable_qty, i.default_unit_cost,
            i.expiry_date, i.shelf_life_status, i.status
     FROM items i JOIN categories c ON c.id = i.category_id
     ORDER BY i.created_at DESC`,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const {
    code,
    name,
    categoryId,
    unit,
    type,
    reorderLevel,
    safetyStockLevel,
    openingQty,
    unitCost,
    expiryDate,
    storeId,
    bin,
  } = req.body;
  if (!code || !name || !categoryId || !type) {
    throw new ApiError(400, "code, name, categoryId, and type are required.");
  }

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO items (code, name, category_id, unit, type, reorder_level, safety_stock_level, default_unit_cost, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        code,
        name,
        categoryId,
        unit || "Piece",
        type,
        reorderLevel || 0,
        safetyStockLevel || 0,
        unitCost || 0,
        expiryDate || null,
      ],
    );
    const item = inserted.rows[0];

    if (Number(openingQty) > 0) {
      await receiveLot(client, {
        itemId: item.id,
        sourceReference: "OPENING-BALANCE",
        qty: Number(openingQty),
        unitCost: Number(unitCost) || 0,
        expiryDate: expiryDate || null,
        userId: req.user.id,
      });

      let targetStoreId = storeId;
      if (!targetStoreId) {
        const defaultStore = await client.query(
          `SELECT id FROM stores ORDER BY created_at ASC LIMIT 1`,
        );
        targetStoreId = defaultStore.rows[0]?.id;
      }

      if (targetStoreId) {
        const targetBin = bin && bin.trim() ? bin.trim() : "SHELF-A1";
        const binCardId = await ensureBinCard(client, {
          storeId: targetStoreId,
          bin: targetBin,
          itemId: item.id,
        });
        await postBinCardEntry(client, {
          binCardId,
          direction: "Inbound",
          reference: "OPENING-BALANCE",
          qty: Number(openingQty),
        });

        await client.query(
          `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()`,
          [item.id, targetStoreId, targetBin],
        );
      }
    }

    await logAction(client, {
      user: req.user,
      module: "Item Master",
      action: `Registered item ${code} — ${name}`,
    });
    return item;
  });

  res.status(201).json(result);
}

module.exports = { list, create };
