const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { applyAdjustment, valuationForItem, num } = require("../utils/fifo");
const { ApiError } = require("../middleware/errorHandler");
const { requireConfirmation } = require("../utils/confirmation");

// Use Case: Monitor Reorder and Safety Stock Levels — computed on demand
// from reorder_alerts_view so it can never go stale.
async function reorderAlerts(req, res) {
  const [reorder, shelfLife] = await Promise.all([
    pool.query(
      `SELECT *, 'Reorder' AS alert_type FROM reorder_alerts_view ORDER BY alert_level, name`,
    ),
    pool.query(
      `SELECT *, 'Shelf Life' AS alert_type FROM shelf_life_alerts_view ORDER BY alert_level, name`,
    ),
  ]);
  res.json([...reorder.rows, ...shelfLife.rows]);
}

async function shelfLifeAlerts(req, res) {
  const rows = await pool.query(
    `SELECT * FROM shelf_life_alerts_view ORDER BY alert_level, expiry_date, name`,
  );
  res.json(rows.rows);
}

// ---------------------------------------------------------------------------
// Use Case: Conduct Physical Stock Taking
// ---------------------------------------------------------------------------
async function listStockTakes(req, res) {
  const rows = await pool.query(
    `SELECT st.*, s.name AS store_name, u.name AS scheduled_by_name
     FROM stock_takes st
     JOIN stores s ON s.id = st.store_id
     JOIN users u ON u.id = st.scheduled_by
     ORDER BY st.created_at DESC`,
  );
  res.json(rows.rows);
}

async function scheduleStockTake(req, res) {
  const { storeId, scheduledDate } = req.body;
  if (!storeId || !scheduledDate)
    throw new ApiError(400, "storeId and scheduledDate are required.");

  const result = await withTransaction(async (client) => {
    const takeRes = await client.query(
      `INSERT INTO stock_takes (store_id, scheduled_by, scheduled_date) VALUES ($1, $2, $3) RETURNING *`,
      [storeId, req.user.id, scheduledDate],
    );
    const take = takeRes.rows[0];

    // Pre-populate one line per item currently located in this store, with
    // the current system quantity captured at scheduling time.
    const itemsInStore = await client.query(
      `SELECT DISTINCT il.item_id, i.qty_on_hand
       FROM item_locations il JOIN items i ON i.id = il.item_id
       WHERE il.store_id = $1`,
      [storeId],
    );
    for (const row of itemsInStore.rows) {
      await client.query(
        `INSERT INTO stock_take_lines (stock_take_id, item_id, system_qty) VALUES ($1, $2, $3)`,
        [take.id, row.item_id, row.qty_on_hand],
      );
    }

    await logAction(client, {
      user: req.user,
      module: "Stock Taking",
      action: `Scheduled physical stock take for ${scheduledDate} (${itemsInStore.rows.length} items in scope)`,
    });

    return take;
  });

  res.status(201).json(result);
}

async function getStockTake(req, res) {
  const { id } = req.params;
  const take = await pool.query(
    `SELECT st.*, s.name AS store_name FROM stock_takes st JOIN stores s ON s.id = st.store_id WHERE st.id = $1`,
    [id],
  );
  if (take.rows.length === 0) throw new ApiError(404, "Stock take not found.");

  const lines = await pool.query(
    `SELECT stl.*, i.code, i.name
     FROM stock_take_lines stl JOIN items i ON i.id = stl.item_id
     WHERE stl.stock_take_id = $1 ORDER BY i.name`,
    [id],
  );

  res.json({ ...take.rows[0], lines: lines.rows });
}

// Records a counted quantity against one line of a stock take.
async function recordCount(req, res) {
  const { id, lineId } = req.params;
  const { countedQty } = req.body;
  if (
    countedQty === undefined ||
    !Number.isFinite(Number(countedQty)) ||
    Number(countedQty) < 0
  )
    throw new ApiError(400, "A non-negative countedQty is required.");

  const result = await withTransaction(async (client) => {
    const line = await client.query(
      `SELECT * FROM stock_take_lines WHERE id = $1 AND stock_take_id = $2 FOR UPDATE`,
      [lineId, id],
    );
    if (line.rows.length === 0)
      throw new ApiError(404, "Stock take line not found.");

    const updated = await client.query(
      `UPDATE stock_take_lines SET counted_qty = $1, counted_by = $2, counted_at = now() WHERE id = $3 RETURNING *`,
      [countedQty, req.user.id, lineId],
    );
    await client.query(
      `UPDATE stock_takes SET status = 'Counting' WHERE id = $1 AND status = 'Scheduled'`,
      [id],
    );
    await logAction(client, {
      user: req.user,
      module: "Stock Taking",
      action: `Recorded physical count for stock take ${id}, line ${lineId}`,
    });

    return updated.rows[0];
  });

  res.json(result);
}

// ---------------------------------------------------------------------------
// Use Case: Reconcile Stock Discrepancies
// ---------------------------------------------------------------------------
async function reconcile(req, res) {
  const { id } = req.params;
  const { findings } = req.body; // { [lineId]: "explanation text" }
  if (
    !["Property Administration Officer", "Administrator"].includes(
      req.user.role,
    )
  ) {
    throw new ApiError(
      403,
      "Only the Property Administration Officer or Administrator can reconcile discrepancies.",
    );
  }
  await requireConfirmation(req);

  const result = await withTransaction(async (client) => {
    const take = await client.query(
      `SELECT * FROM stock_takes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (take.rows.length === 0)
      throw new ApiError(404, "Stock take not found.");

    const lines = await client.query(
      `SELECT * FROM stock_take_lines WHERE stock_take_id = $1`,
      [id],
    );
    const uncounted = lines.rows.filter((l) => l.counted_qty === null);
    if (uncounted.length > 0) {
      throw new ApiError(
        400,
        `${uncounted.length} item(s) have not yet been counted.`,
      );
    }

    const adjustments = [];
    for (const line of lines.rows) {
      const discrepancy = num(line.counted_qty) - num(line.system_qty);
      if (discrepancy === 0) continue;

      const finding =
        (findings && findings[line.id]) || "No explanation provided.";
      await client.query(
        `INSERT INTO reconciliation_entries (stock_take_line_id, item_id, adjustment_qty, finding, authorized_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [line.id, line.item_id, discrepancy, finding, req.user.id],
      );

      await applyAdjustment(client, {
        itemId: line.item_id,
        signedQty: discrepancy,
        reference: `RECONCILIATION-${id}`,
        userId: req.user.id,
      });

      adjustments.push({ itemId: line.item_id, discrepancy, finding });
    }

    await client.query(
      `UPDATE stock_takes SET status = 'Reconciled' WHERE id = $1`,
      [id],
    );

    await logAction(client, {
      user: req.user,
      module: "Reconciliation",
      action: `Reconciled stock take with ${adjustments.length} adjustment(s)`,
    });

    return { stockTakeId: id, adjustments };
  });

  res.json(result);
}

// ---------------------------------------------------------------------------
// Use Case: Compute FIFO Valuation and Generate Valuation Report
// ---------------------------------------------------------------------------
async function valuationReport(req, res) {
  const { itemId } = req.query;

  if (itemId) {
    const client = await pool.connect();
    try {
      const val = await valuationForItem(client, itemId);
      return res.json(val);
    } finally {
      client.release();
    }
  }

  // No itemId: summarize valuation across every active item.
  const items = await pool.query(
    `SELECT id, code, name FROM items WHERE status = 'Active' ORDER BY name`,
  );
  const client = await pool.connect();
  try {
    const results = [];
    for (const item of items.rows) {
      const val = await valuationForItem(client, item.id);
      results.push({
        itemId: item.id,
        code: item.code,
        name: item.name,
        totalValue: val.totalValue,
        totalQtyRemaining: val.totalQtyRemaining,
      });
    }
    const grandTotal = results.reduce((sum, r) => sum + r.totalValue, 0);
    res.json({ items: results, grandTotal });
  } finally {
    client.release();
  }
}

module.exports = {
  reorderAlerts,
  shelfLifeAlerts,
  listStockTakes,
  scheduleStockTake,
  getStockTake,
  recordCount,
  reconcile,
  valuationReport,
};
