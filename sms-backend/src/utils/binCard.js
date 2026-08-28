const num = (v) => (v === null || v === undefined ? 0 : parseFloat(v));

// Ensures a bin_cards row exists for (storeId, bin, itemId), creating one on
// first use ("dynamically generates a new bin card" per the SRS use case).
async function ensureBinCard(client, { storeId, bin, itemId }) {
  const existing = await client.query(
    `SELECT id FROM bin_cards WHERE store_id = $1 AND bin = $2 AND item_id = $3`,
    [storeId, bin, itemId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO bin_cards (store_id, bin, item_id) VALUES ($1, $2, $3) RETURNING id`,
    [storeId, bin, itemId]
  );
  return created.rows[0].id;
}

// Appends a movement to a bin card and returns the new balance.
async function postBinCardEntry(client, { binCardId, direction, reference, qty }) {
  const last = await client.query(
    `SELECT balance FROM bin_card_entries WHERE bin_card_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [binCardId]
  );
  const priorBalance = last.rows.length > 0 ? num(last.rows[0].balance) : 0;
  const signedQty = direction === "Inbound" ? qty : -qty;
  const newBalance = priorBalance + signedQty;

  await client.query(
    `INSERT INTO bin_card_entries (bin_card_id, direction, reference, qty, balance)
     VALUES ($1, $2, $3, $4, $5)`,
    [binCardId, direction, reference, signedQty, newBalance]
  );

  return newBalance;
}

// Finds the bin currently holding an item within a store (falls back to a
// default bin name if the item has no recorded location yet).
async function resolveItemBin(client, { storeId, itemId }) {
  const loc = await client.query(`SELECT bin FROM item_locations WHERE store_id = $1 AND item_id = $2`, [
    storeId,
    itemId,
  ]);
  return loc.rows.length > 0 ? loc.rows[0].bin : "UNASSIGNED";
}

module.exports = { ensureBinCard, postBinCardEntry, resolveItemBin };
