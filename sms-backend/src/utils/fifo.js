const { ApiError } = require("../middleware/errorHandler");

// node-postgres returns NUMERIC columns as strings to avoid float precision
// loss; convert explicitly wherever we do arithmetic in JS.
const num = (v) => (v === null || v === undefined ? 0 : parseFloat(v));

/**
 * Receives a new FIFO cost lot for an item and appends the corresponding
 * Stock Card entry. Used by: Generate GRN, Approve Store Return
 * (reinstatement), positive Reconciliation adjustments.
 *
 * Must be called with a `client` that is inside an open transaction.
 */
async function receiveLot(
  client,
  {
    itemId,
    sourceReference,
    qty,
    unitCost,
    expiryDate = null,
    type = "Receipt",
    userId,
  },
) {
  if (qty <= 0) throw new ApiError(400, "Received quantity must be positive.");

  await client.query(
    `INSERT INTO cost_lots (item_id, source_reference, qty_received, qty_remaining, unit_cost, expiry_date)
     VALUES ($1, $2, $3, $3, $4, $5)`,
    [itemId, sourceReference, qty, unitCost, expiryDate],
  );

  const itemRes = await client.query(
    `SELECT qty_on_hand FROM items WHERE id = $1 FOR UPDATE`,
    [itemId],
  );
  if (itemRes.rows.length === 0) throw new ApiError(404, "Item not found.");
  const newBalance = num(itemRes.rows[0].qty_on_hand) + qty;

  await client.query(
    `UPDATE items SET qty_on_hand = $1, updated_at = now() WHERE id = $2`,
    [newBalance, itemId],
  );

  await client.query(
    `INSERT INTO stock_card_entries (item_id, type, qty, balance, cost_amount, reference, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [itemId, type, qty, newBalance, qty * unitCost, sourceReference, userId],
  );

  return { newBalance };
}

/**
 * Consumes `qty` from an item's remaining FIFO cost lots, oldest first, and
 * appends the corresponding (negative) Stock Card entry. Used by: Generate
 * SIV/ISIV (Model 22), approved Material Transfer, Manage Disposal Workflow
 * (final removal), negative Reconciliation adjustments.
 *
 * Returns the total FIFO cost of the consumed quantity, which is the value
 * a Valuation Report attributes to that issue/disposal/transfer.
 */
async function consumeFifo(client, { itemId, qty, type, reference, userId }) {
  if (qty <= 0)
    throw new ApiError(400, "Quantity to consume must be positive.");

  const itemRes = await client.query(
    `SELECT qty_on_hand FROM items WHERE id = $1 FOR UPDATE`,
    [itemId],
  );
  if (itemRes.rows.length === 0) throw new ApiError(404, "Item not found.");
  const onHand = num(itemRes.rows[0].qty_on_hand);
  if (onHand < qty) {
    throw new ApiError(
      400,
      `Insufficient stock: ${onHand} on hand, ${qty} requested.`,
    );
  }

  const lotsRes = await client.query(
    `SELECT id, qty_remaining, unit_cost FROM cost_lots
     WHERE item_id = $1 AND qty_remaining > 0
     ORDER BY received_at ASC
     FOR UPDATE`,
    [itemId],
  );

  let remainingToConsume = qty;
  let totalCost = 0;

  for (const lot of lotsRes.rows) {
    if (remainingToConsume <= 0) break;
    const lotQty = num(lot.qty_remaining);
    const takeFromLot = Math.min(lotQty, remainingToConsume);
    const newLotQty = lotQty - takeFromLot;

    await client.query(
      `UPDATE cost_lots SET qty_remaining = $1 WHERE id = $2`,
      [newLotQty, lot.id],
    );

    totalCost += takeFromLot * num(lot.unit_cost);
    remainingToConsume -= takeFromLot;
  }

  if (remainingToConsume > 0) {
    // Should not happen if qty_on_hand and cost_lots are kept consistent,
    // but guard against drift rather than silently under-costing.
    throw new ApiError(
      400,
      "Cost lot ledger is inconsistent with qty_on_hand; reconciliation required.",
    );
  }

  const newBalance = onHand - qty;
  await client.query(
    `UPDATE items SET qty_on_hand = $1, updated_at = now() WHERE id = $2`,
    [newBalance, itemId],
  );

  await client.query(
    `INSERT INTO stock_card_entries (item_id, type, qty, balance, cost_amount, reference, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [itemId, type, -qty, newBalance, -totalCost, reference, userId],
  );

  return { newBalance, totalCost };
}

/**
 * Applies a signed reconciliation adjustment: positive receives a new lot
 * at the item's current default unit cost, negative consumes via FIFO.
 * Used exclusively by: Reconcile Stock Discrepancies.
 */
async function applyAdjustment(
  client,
  { itemId, signedQty, reference, userId },
) {
  if (signedQty === 0) return { newBalance: null };

  if (signedQty > 0) {
    const itemRes = await client.query(
      `SELECT default_unit_cost FROM items WHERE id = $1`,
      [itemId],
    );
    const unitCost = num(itemRes.rows[0]?.default_unit_cost);
    return receiveLot(client, {
      itemId,
      sourceReference: reference,
      qty: signedQty,
      unitCost,
      type: "Adjustment",
      userId,
    });
  }

  return consumeFifo(client, {
    itemId,
    qty: Math.abs(signedQty),
    type: "Adjustment",
    reference,
    userId,
  });
}

/**
 * Computes a FIFO valuation snapshot for one item: total remaining value at
 * current cost lots, plus a simple ledger of cost impact per Stock Card
 * entry (Use Case: Compute FIFO Valuation and Generate Valuation Report).
 */
async function valuationForItem(client, itemId) {
  const lots = await client.query(
    `SELECT id, source_reference, qty_received, qty_remaining, unit_cost, expiry_date, received_at
     FROM cost_lots WHERE item_id = $1 AND qty_remaining > 0 ORDER BY received_at ASC`,
    [itemId],
  );
  const totalValue = lots.rows.reduce(
    (sum, l) => sum + num(l.qty_remaining) * num(l.unit_cost),
    0,
  );
  const totalQty = lots.rows.reduce((sum, l) => sum + num(l.qty_remaining), 0);

  return {
    itemId,
    totalQtyRemaining: totalQty,
    totalValue,
    averageUnitCost: totalQty > 0 ? totalValue / totalQty : 0,
    lots: lots.rows.map((l) => ({
      id: l.id,
      sourceReference: l.source_reference,
      qtyReceived: num(l.qty_received),
      qtyRemaining: num(l.qty_remaining),
      unitCost: num(l.unit_cost),
      expiryDate: l.expiry_date,
      receivedAt: l.received_at,
      lineValue: num(l.qty_remaining) * num(l.unit_cost),
    })),
  };
}

module.exports = {
  receiveLot,
  consumeFifo,
  applyAdjustment,
  valuationForItem,
  num,
};
