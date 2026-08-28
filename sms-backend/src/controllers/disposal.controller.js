const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { consumeFifo } = require("../utils/fifo");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const visibility =
    req.user.role === "Disposal Committee" ||
    req.user.role === "Property Administration Officer" ||
    req.user.role === "Accountant"
      ? ""
      : "WHERE dr.flagged_by = $1";
  const params = visibility ? [req.user.id] : [];
  const rows = await pool.query(
    `SELECT dr.*, i.name AS item_name
     FROM disposal_requests dr JOIN items i ON i.id = dr.item_id
     ${visibility}
     ORDER BY dr.created_at DESC`,
    params,
  );
  res.json(rows.rows);
}

// Use Case: Flag Items for Disposal.
async function flag(req, res) {
  const { itemId, qty, reason, fixedAssetId } = req.body;
  if (!itemId || !qty || !reason)
    throw new ApiError(400, "itemId, qty, and reason are required.");

  const result = await withTransaction(async (client) => {
    const itemResult = await client.query(
      `SELECT id, qty_on_hand, disposal_reserved_qty FROM items WHERE id = $1 FOR UPDATE`,
      [itemId],
    );
    if (itemResult.rows.length === 0)
      throw new ApiError(404, "Item not found.");
    const item = itemResult.rows[0];
    const available =
      Number(item.qty_on_hand) - Number(item.disposal_reserved_qty || 0);
    if (Number(qty) > available) {
      throw new ApiError(
        400,
        `Only ${available} usable quantity is available for disposal.`,
      );
    }
    if (fixedAssetId) {
      const assetResult = await client.query(
        `SELECT id, item_id, status FROM fixed_assets WHERE id = $1 FOR UPDATE`,
        [fixedAssetId],
      );
      if (assetResult.rows.length === 0)
        throw new ApiError(404, "Fixed asset not found.");
      if (assetResult.rows[0].item_id !== itemId) {
        throw new ApiError(
          400,
          "Fixed asset does not belong to the selected item.",
        );
      }
      if (assetResult.rows[0].status === "Disposed") {
        throw new ApiError(
          400,
          "A disposed fixed asset cannot be submitted again.",
        );
      }
    }
    const refNo = generateRefNo("DR");
    const inserted = await client.query(
      `INSERT INTO disposal_requests (ref_no, item_id, qty, fixed_asset_id, reason, flagged_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [refNo, itemId, qty, fixedAssetId || null, reason, req.user.id],
    );
    await client.query(
      `UPDATE items SET disposal_reserved_qty = disposal_reserved_qty + $1, shelf_life_status = 'Pending Disposal', updated_at = now() WHERE id = $2`,
      [qty, itemId],
    );
    await logAction(client, {
      user: req.user,
      module: "Disposal",
      action: `Flagged item for disposal ${refNo}`,
    });
    await notifyRoles(client, {
      roles: [
        "Property Administration Officer",
        "Technical Evaluation Committee",
      ],
      title: "Item flagged for disposal",
      message: `Disposal request ${refNo} requires review.`,
      module: "Disposal",
      referenceId: inserted.rows[0].id,
      severity: "Warning",
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

// Use Case: Manage Disposal Workflow — the Disposal Committee's decision.
// Approval permanently removes the item from active stock via FIFO
// consumption; the Accountant records the financial write-off downstream.
async function decide(req, res) {
  const { id } = req.params;
  const { decision, method } = req.body;
  await requireConfirmation(req);
  if (!["Approved", "Rejected"].includes(decision))
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");
  if (
    decision === "Approved" &&
    !["Auction", "Destruction", "Donation", "Write-off"].includes(method)
  ) {
    throw new ApiError(
      400,
      "A valid disposal method is required when approving.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM disposal_requests WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Disposal request not found.");
    const request = current.rows[0];
    if (request.status !== "Forwarded to Committee") {
      throw new ApiError(
        400,
        `Disposal request is '${request.status}' and cannot be re-decided.`,
      );
    }

    const finalStatus = decision === "Approved" ? "Disposed" : "Rejected";
    const updated = await client.query(
      `UPDATE disposal_requests SET status = $1, method = $2, decided_by = $3, decided_at = now() WHERE id = $4 RETURNING *`,
      [finalStatus, decision === "Approved" ? method : null, req.user.id, id],
    );

    if (decision === "Approved") {
      await consumeFifo(client, {
        itemId: request.item_id,
        qty: parseFloat(request.qty),
        type: "Disposal",
        reference: request.ref_no,
        userId: req.user.id,
      });
      if (request.fixed_asset_id) {
        await client.query(
          `UPDATE fixed_assets SET status = 'Disposed' WHERE id = $1`,
          [request.fixed_asset_id],
        );
      }
      await client.query(
        `UPDATE items SET disposal_reserved_qty = GREATEST(disposal_reserved_qty - $1, 0),
         shelf_life_status = CASE WHEN qty_on_hand - GREATEST(disposal_reserved_qty - $1, 0) <= 0 THEN 'Disposed' ELSE shelf_life_status END,
         updated_at = now() WHERE id = $2`,
        [request.qty, request.item_id],
      );
    } else {
      await client.query(
        `UPDATE items SET disposal_reserved_qty = GREATEST(disposal_reserved_qty - $1, 0), shelf_life_status = CASE WHEN disposal_reserved_qty - $1 <= 0 THEN 'Available' ELSE shelf_life_status END, updated_at = now() WHERE id = $2`,
        [request.qty, request.item_id],
      );
    }

    await logAction(client, {
      user: req.user,
      module: "Disposal",
      action: `${decision} disposal request ${request.ref_no}${decision === "Approved" ? ` via ${method}` : ""}`,
    });
    await notifyRoles(client, {
      roles: ["Accountant", "Property Administration Officer"],
      title: `Disposal request ${decision.toLowerCase()}`,
      message: `Disposal request ${request.ref_no} was ${decision.toLowerCase()}.`,
      module: "Disposal",
      referenceId: id,
      severity: decision === "Rejected" ? "Info" : "Warning",
    });

    return updated.rows[0];
  });

  res.json(result);
}

async function forward(req, res) {
  const { id } = req.params;
  const { notes } = req.body || {};

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM disposal_requests WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Disposal request not found.");
    const request = current.rows[0];
    if (request.status !== "Pending Disposal") {
      throw new ApiError(
        400,
        `Disposal request is '${request.status}' and cannot be forwarded.`,
      );
    }

    const updated = await client.query(
      `UPDATE disposal_requests
       SET status = 'Forwarded to Committee', forwarded_by = $1, forwarded_at = now(), review_notes = $2
       WHERE id = $3 RETURNING *`,
      [req.user.id, notes || null, id],
    );

    await logAction(client, {
      user: req.user,
      module: "Disposal",
      action: `PAO reviewed and forwarded disposal request ${request.ref_no} to Disposal Committee${notes ? ` (Review remarks: ${notes})` : ""}`,
    });
    await notifyRoles(client, {
      roles: ["Disposal Committee"],
      title: "Disposal request forwarded",
      message: `Disposal request ${request.ref_no} was forwarded for committee decision.`,
      module: "Disposal",
      referenceId: id,
    });

    return updated.rows[0];
  });

  res.json(result);
}

async function recordFinancialWriteOff(req, res) {
  const { id } = req.params;
  const { amount, notes } = req.body || {};
  if (
    amount === undefined ||
    amount === null ||
    Number.isNaN(Number(amount)) ||
    Number(amount) < 0
  ) {
    throw new ApiError(400, "A non-negative write-off amount is required.");
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM disposal_requests WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Disposal request not found.");
    if (current.rows[0].status !== "Disposed")
      throw new ApiError(
        400,
        "Only an approved and disposed request can be written off.",
      );
    if (current.rows[0].financial_write_off_at)
      throw new ApiError(
        400,
        "A financial write-off has already been recorded.",
      );

    const updated = await client.query(
      `UPDATE disposal_requests
       SET financial_write_off_amount = $1, financial_write_off_by = $2,
           financial_write_off_at = now(), financial_write_off_notes = $3
       WHERE id = $4 RETURNING *`,
      [amount, req.user.id, notes || null, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Disposal",
      action: `Recorded financial write-off for disposal request ${current.rows[0].ref_no}`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, flag, forward, decide, recordFinancialWriteOff };
