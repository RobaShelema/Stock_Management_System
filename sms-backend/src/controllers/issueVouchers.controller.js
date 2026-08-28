const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { consumeFifo } = require("../utils/fifo");
const {
  ensureBinCard,
  postBinCardEntry,
  resolveItemBin,
} = require("../utils/binCard");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const conditions = [];
  const params = [];
  const storeIds = await assignedStoreIds(req.user);
  if (req.user.role === "Campus Security Officer")
    conditions.push("iv.status = 'Issued'");
  if (req.user.role === "Requesting Staff") {
    params.push(req.user.id);
    conditions.push(`sr.requested_by = $${params.length}`);
    conditions.push("iv.status = 'Issued'");
  }
  if (storeIds) {
    params.push(storeIds);
    conditions.push(`iv.store_id = ANY($${params.length}::uuid[])`);
  }
  if (req.user.role === "Department Head" && req.user.department) {
    params.push(req.user.department);
    conditions.push(`LOWER(sr.department) = LOWER($${params.length})`);
  }
  const statusFilter = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const rows = await pool.query(
    `SELECT iv.*, i.name AS item_name, s.name AS store_name, sr.ref_no AS requisition_ref,
      approver.name AS approved_by_name,
      gc.id IS NOT NULL AS gate_clearance,
      gc.cleared_at AS gate_cleared_at,
      clearance_user.name AS gate_cleared_by_name,
      gc.notes AS gate_clearance_notes
     FROM issue_vouchers iv
     JOIN items i ON i.id = iv.item_id
     JOIN stores s ON s.id = iv.store_id
     JOIN store_requisitions sr ON sr.id = iv.requisition_id
     LEFT JOIN users approver ON approver.id = iv.approved_by
    LEFT JOIN gate_clearances gc ON gc.issue_voucher_id = iv.id
    LEFT JOIN users clearance_user ON clearance_user.id = gc.cleared_by
    ${statusFilter}
     ORDER BY iv.created_at DESC`,
    params,
  );
  res.json(rows.rows);
}

async function recordGateClearance(req, res) {
  const { id } = req.params;
  const { notes } = req.body || {};

  const result = await withTransaction(async (client) => {
    const voucher = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (voucher.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    if (
      voucher.rows[0].status !== "Issued" ||
      voucher.rows[0].model !== "Model 22 (Final)"
    ) {
      throw new ApiError(
        400,
        "Gate clearance requires a finalized Model 22 voucher.",
      );
    }

    const existing = await client.query(
      `SELECT id FROM gate_clearances WHERE issue_voucher_id = $1`,
      [id],
    );
    if (existing.rows.length > 0) {
      throw new ApiError(
        400,
        "Gate clearance has already been recorded for this voucher.",
      );
    }

    const clearance = await client.query(
      `INSERT INTO gate_clearances (issue_voucher_id, cleared_by, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, notes || null],
    );
    await logAction(client, {
      user: req.user,
      module: "Gate Clearance",
      action: `Recorded gate clearance for voucher ${voucher.rows[0].ref_no}`,
    });
    return clearance.rows[0];
  });

  res.status(201).json(result);
}

// Use Case: Create Preliminary SIV/ISIV (Model 20).
async function createPreliminary(req, res) {
  const { requisitionId } = req.body;
  if (!requisitionId) throw new ApiError(400, "requisitionId is required.");

  const result = await withTransaction(async (client) => {
    const reqRes = await client.query(
      `SELECT * FROM store_requisitions WHERE id = $1 FOR UPDATE`,
      [requisitionId],
    );
    if (reqRes.rows.length === 0)
      throw new ApiError(404, "Requisition not found.");
    const requisition = reqRes.rows[0];
    if (requisition.status !== "Approved") {
      throw new ApiError(
        400,
        "A preliminary voucher can only be created from an Approved requisition.",
      );
    }

    const refNo = generateRefNo("SIV");
    const inserted = await client.query(
      `INSERT INTO issue_vouchers (ref_no, requisition_id, store_id, item_id, qty, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        refNo,
        requisitionId,
        requisition.store_id,
        requisition.item_id,
        requisition.qty,
        req.user.id,
      ],
    );

    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Created preliminary voucher ${refNo} (Model 20) for requisition ${requisition.ref_no}`,
    });

    return inserted.rows[0];
  });

  res.status(201).json(result);
}

// Use Case: Approve and Amend SIV/ISIV — allows quantity amendment while
// still Preliminary, before Generate SIV/ISIV finalizes it.
async function amend(req, res) {
  const { id } = req.params;
  const { qty } = req.body;
  if (!qty || qty <= 0) throw new ApiError(400, "A positive qty is required.");

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    if (current.rows[0].status !== "Preliminary")
      throw new ApiError(400, "Only a Preliminary voucher can be amended.");

    const updated = await client.query(
      `UPDATE issue_vouchers SET qty = $1 WHERE id = $2 RETURNING *`,
      [qty, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Amended voucher ${current.rows[0].ref_no} quantity to ${qty}`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

// Use Case: Approve and Amend SIV/ISIV (Model 20).
async function approve(req, res) {
  const { id } = req.params;
  const { decision, remarks } = req.body || {};
  await requireConfirmation(req);
  if (!["Approved", "Rejected"].includes(decision)) {
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    if (current.rows[0].status !== "Preliminary") {
      throw new ApiError(
        400,
        "Only a Preliminary Model 20 voucher can be approved or rejected.",
      );
    }

    const updated = await client.query(
      `UPDATE issue_vouchers
       SET status = $1, approved_by = $2, approved_at = now(), approval_remarks = $3
       WHERE id = $4 RETURNING *`,
      [decision, req.user.id, remarks || null, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `${decision} preliminary voucher ${current.rows[0].ref_no}${remarks ? ` (${remarks})` : ""}`,
    });
    await notifyRoles(client, {
      roles: ["Store Head"],
      title: `Model 20 voucher ${decision.toLowerCase()}`,
      message: `Voucher ${current.rows[0].ref_no} is ${decision.toLowerCase()}.`,
      module: "Issuing",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

// Use Case: Generate SIV/ISIV (Model 22) — finalizes issuing, deducts stock.
async function finalize(req, res) {
  const { id } = req.params;
  await requireConfirmation(req);

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    const voucher = current.rows[0];
    if (voucher.status !== "Approved")
      throw new ApiError(
        400,
        "Only an approved Model 20 voucher can be finalized as Model 22.",
      );

    const finalRefNo = voucher.ref_no.replace("SIV", "SIV-M22");

    const updated = await client.query(
      `UPDATE issue_vouchers
       SET status = 'Issued', model = 'Model 22 (Final)', finalized_by = $1, finalized_at = now()
       WHERE id = $2 RETURNING *`,
      [req.user.id, id],
    );

    await consumeFifo(client, {
      itemId: voucher.item_id,
      qty: parseFloat(voucher.qty),
      type: "Issue",
      reference: voucher.ref_no,
      userId: req.user.id,
    });

    const bin = await resolveItemBin(client, {
      storeId: voucher.store_id,
      itemId: voucher.item_id,
    });
    const binCardId = await ensureBinCard(client, {
      storeId: voucher.store_id,
      bin,
      itemId: voucher.item_id,
    });
    await postBinCardEntry(client, {
      binCardId,
      direction: "Outbound",
      reference: voucher.ref_no,
      qty: parseFloat(voucher.qty),
    });

    await client.query(
      `UPDATE store_requisitions SET status = 'Issued' WHERE id = $1`,
      [voucher.requisition_id],
    );

    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Generated final issue voucher ${voucher.ref_no} (Model 22) and deducted stock`,
    });
    await notifyRoles(client, {
      roles: ["Campus Security Officer", "Department Head"],
      title: "Model 22 issued",
      message: `Voucher ${voucher.ref_no} was finalized and stock was deducted.`,
      module: "Issuing",
      referenceId: id,
      severity: "Success",
    });

    return updated.rows[0];
  });

  res.json(result);
}

module.exports = {
  list,
  createPreliminary,
  amend,
  approve,
  finalize,
  recordGateClearance,
};
