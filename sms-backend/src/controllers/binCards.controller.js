const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");
const { ensureBinCard, postBinCardEntry } = require("../utils/binCard");

async function list(req, res) {
  const rows = await pool.query(
    `SELECT bc.id, bc.store_id, s.name AS store_name, bc.bin, bc.item_id, i.name AS item_name
     FROM bin_cards bc
     JOIN stores s ON s.id = bc.store_id
     JOIN items i ON i.id = bc.item_id
     ORDER BY s.name, bc.bin`
  );
  res.json(rows.rows);
}

async function getEntries(req, res) {
  const { id } = req.params;
  const entries = await pool.query(
    `SELECT id, direction, reference, qty, balance, created_at
     FROM bin_card_entries WHERE bin_card_id = $1 ORDER BY created_at DESC`,
    [id]
  );
  res.json(entries.rows);
}

// Use Case: Transfer Stock Between Bins (same store).
async function transferBetweenBins(req, res) {
  const { storeId, itemId, fromBin, toBin, qty } = req.body;
  if (!storeId || !itemId || !fromBin || !toBin || !qty) {
    throw new ApiError(400, "storeId, itemId, fromBin, toBin, and qty are required.");
  }
  if (fromBin === toBin) throw new ApiError(400, "Source and destination bins must differ.");

  const result = await withTransaction(async (client) => {
    const fromCardRes = await client.query(
      `SELECT id FROM bin_cards WHERE store_id = $1 AND bin = $2 AND item_id = $3`,
      [storeId, fromBin, itemId]
    );
    if (fromCardRes.rows.length === 0) throw new ApiError(404, "Source bin card not found.");
    const fromCardId = fromCardRes.rows[0].id;

    const lastEntry = await client.query(
      `SELECT balance FROM bin_card_entries WHERE bin_card_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [fromCardId]
    );
    const available = lastEntry.rows.length > 0 ? parseFloat(lastEntry.rows[0].balance) : 0;
    if (available < qty) throw new ApiError(400, `Insufficient quantity in source bin: ${available} available.`);

    const reference = `BIN-TRANSFER-${Date.now().toString(36).toUpperCase()}`;
    await postBinCardEntry(client, { binCardId: fromCardId, direction: "Outbound", reference, qty });

    const toCardId = await ensureBinCard(client, { storeId, bin: toBin, itemId });
    await postBinCardEntry(client, { binCardId: toCardId, direction: "Inbound", reference, qty });

    await client.query(
      `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()`,
      [itemId, storeId, toBin]
    );

    await logAction(client, {
      user: req.user,
      module: "Bin Card",
      action: `Transferred ${qty} units from bin ${fromBin} to bin ${toBin} (${reference})`,
    });

    return { reference, fromBin, toBin, qty };
  });

  res.json(result);
}

module.exports = { list, getEntries, transferBetweenBins };
