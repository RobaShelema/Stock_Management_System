const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const {
  ensureBinCard,
  postBinCardEntry,
  resolveItemBin,
} = require("../utils/binCard");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { requireConfirmation } = require("../utils/confirmation");

// Note: the Stock Card is an organization-wide ledger, so an inter-store
// transfer does not change an item's total qty_on_hand — only the Bin Cards
// (and item_locations) at the source and destination stores change.

async function list(req, res) {
  const rows = await pool.query(
    `SELECT mt.*, i.name AS item_name, fs.name AS from_store_name, ts.name AS to_store_name
     FROM material_transfers mt
     JOIN items i ON i.id = mt.item_id
     JOIN stores fs ON fs.id = mt.from_store_id
     JOIN stores ts ON ts.id = mt.to_store_id
     ORDER BY mt.created_at DESC`,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { itemId, qty, fromStoreId, toStoreId } = req.body;
  if (!itemId || !qty || !fromStoreId || !toStoreId) {
    throw new ApiError(
      400,
      "itemId, qty, fromStoreId, and toStoreId are required.",
    );
  }
  if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
    throw new ApiError(400, "qty must be a positive number.");
  }
  if (fromStoreId === toStoreId)
    throw new ApiError(400, "Source and destination stores must differ.");

  const result = await withTransaction(async (client) => {
    const refNo = generateRefNo("MT");
    const inserted = await client.query(
      `INSERT INTO material_transfers (ref_no, item_id, qty, from_store_id, to_store_id, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [refNo, itemId, qty, fromStoreId, toStoreId, req.user.id],
    );
    await logAction(client, {
      user: req.user,
      module: "Transfers",
      action: `Initiated material transfer ${refNo}`,
    });
    await notifyRoles(client, {
      roles: ["Property Administration Officer"],
      title: "Inter-store transfer awaiting approval",
      message: `Transfer ${refNo} requires PAO approval.`,
      module: "Transfers",
      referenceId: inserted.rows[0].id,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function decide(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  await requireConfirmation(req);
  if (!["Approved", "Rejected"].includes(decision))
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM material_transfers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Transfer request not found.");
    const transfer = current.rows[0];
    if (transfer.status !== "Pending Approval") {
      throw new ApiError(
        400,
        `Transfer is '${transfer.status}' and cannot be re-decided.`,
      );
    }

    let fromBin;
    let fromCardId;
    if (decision === "Approved") {
      const qty = parseFloat(transfer.qty);

      fromBin = await resolveItemBin(client, {
        storeId: transfer.from_store_id,
        itemId: transfer.item_id,
      });
      fromCardId = await ensureBinCard(client, {
        storeId: transfer.from_store_id,
        bin: fromBin,
        itemId: transfer.item_id,
      });
      const sourceBalance = await client.query(
        `SELECT balance FROM bin_card_entries
         WHERE bin_card_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 1
         FOR UPDATE`,
        [fromCardId],
      );
      const availableQty = Number(sourceBalance.rows[0]?.balance || 0);
      if (qty > availableQty) {
        throw new ApiError(
          400,
          `Insufficient source-bin stock. Available quantity: ${availableQty}.`,
        );
      }

      await postBinCardEntry(client, {
        binCardId: fromCardId,
        direction: "Outbound",
        reference: transfer.ref_no,
        qty,
      });

      const existingToLoc = await client.query(
        `SELECT bin FROM item_locations WHERE item_id = $1 AND store_id = $2`,
        [transfer.item_id, transfer.to_store_id],
      );
      const toBin = existingToLoc.rows[0]?.bin || "TRANSFER-IN";
      const toCardId = await ensureBinCard(client, {
        storeId: transfer.to_store_id,
        bin: toBin,
        itemId: transfer.item_id,
      });
      await postBinCardEntry(client, {
        binCardId: toCardId,
        direction: "Inbound",
        reference: transfer.ref_no,
        qty,
      });

      await client.query(
        `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (item_id, store_id) DO UPDATE SET updated_at = now()`,
        [transfer.item_id, transfer.to_store_id, toBin],
      );
    }

    const updated = await client.query(
      `UPDATE material_transfers SET status = $1, decided_by = $2 WHERE id = $3 RETURNING *`,
      [decision, req.user.id, id],
    );

    await logAction(client, {
      user: req.user,
      module: "Transfers",
      action: `${decision} material transfer ${transfer.ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Store Head"],
      title: `Inter-store transfer ${decision.toLowerCase()}`,
      message: `Transfer ${transfer.ref_no} was ${decision.toLowerCase()}.`,
      module: "Transfers",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, decide };
