const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds, requireDepartment } = require("../utils/scope");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const conditions = [];
  const params = [];

  if (req.user.role === "Department Head") {
    if (req.user.department) {
      params.push(req.user.department);
      conditions.push(`LOWER(sr.department) = LOWER($${params.length})`);
    }
  } else if (req.user.role === "Requesting Staff") {
    params.push(req.user.id);
    conditions.push(`sr.requested_by = $${params.length}`);
  } else {
    const storeIds = await assignedStoreIds(req.user);
    if (storeIds) {
      params.push(storeIds);
      conditions.push(`sr.store_id = ANY($${params.length}::uuid[])`);
    }
  }

  const scope = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await pool.query(
    `SELECT sr.*, i.name AS item_name, s.name AS store_name, u.name AS requested_by_name
     FROM store_requisitions sr
     JOIN items i ON i.id = sr.item_id
     JOIN stores s ON s.id = sr.store_id
     JOIN users u ON u.id = sr.requested_by
    ${scope}
    ORDER BY sr.created_at DESC`,
    params,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { department, storeId, itemId, qty } = req.body;
  if (!department || !storeId || !itemId || !qty) {
    throw new ApiError(
      400,
      "department, storeId, itemId, and qty are required.",
    );
  }
  if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
    throw new ApiError(400, "qty must be a positive number.");
  }
  if (["Department Head", "Requesting Staff"].includes(req.user.role)) {
    await requireDepartment(req.user, department);
  }

  const result = await withTransaction(async (client) => {
    if (["Store Head", "Stock Clerk"].includes(req.user.role)) {
      const storeScope = await client.query(
        `SELECT 1 FROM stores WHERE id = $1 AND (head_user_id = $2 OR id = (SELECT store_id FROM users WHERE id = $2))`,
        [storeId, req.user.id],
      );
      if (!storeScope.rows.length)
        throw new ApiError(403, "You are not assigned to this store.");
    }
    const itemResult = await client.query(
      `SELECT name, qty_on_hand, disposal_reserved_qty
       FROM items WHERE id = $1 AND status = 'Active' FOR UPDATE`,
      [itemId],
    );
    if (itemResult.rows.length === 0)
      throw new ApiError(404, "Active item not found.");
    const item = itemResult.rows[0];
    const availableQty =
      Number(item.qty_on_hand) - Number(item.disposal_reserved_qty || 0);
    if (Number(qty) > availableQty) {
      throw new ApiError(
        400,
        `Insufficient stock for ${item.name}. Available quantity: ${availableQty}.`,
      );
    }
    const refNo = generateRefNo("SR");
    const inserted = await client.query(
      `INSERT INTO store_requisitions (ref_no, department, requested_by, store_id, item_id, qty, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        refNo,
        department,
        req.user.id,
        storeId,
        itemId,
        qty,
        req.user.role === "Requesting Staff"
          ? "Pending Department Approval"
          : "Pending PAO Approval",
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Requisition",
      action: `Submitted requisition ${refNo}`,
    });
    await notifyRoles(client, {
      roles:
        req.user.role === "Requesting Staff"
          ? ["Department Head"]
          : ["Property Administration Officer"],
      title: "Store requisition awaiting approval",
      message: `Requisition ${refNo} requires approval.`,
      module: "Requisition",
      referenceId: inserted.rows[0].id,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function decide(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  if (!["Approved", "Rejected"].includes(decision))
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");

  // Only require password confirmation for senior PAO approval, not for Department Head first-level review
  if (req.user.role === "Property Administration Officer") {
    await requireConfirmation(req);
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM store_requisitions WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Requisition not found.");
    const requisition = current.rows[0];
    const isDepartmentStage =
      requisition.status === "Pending Department Approval" ||
      (requisition.status === "Pending Approval" &&
        req.user.role === "Department Head");
    const isPaoStage =
      requisition.status === "Pending PAO Approval" ||
      (requisition.status === "Pending Approval" &&
        req.user.role === "Property Administration Officer");
    if (!isDepartmentStage && !isPaoStage) {
      throw new ApiError(
        400,
        `Requisition is '${requisition.status}' and cannot be decided by this actor.`,
      );
    }
    if (isDepartmentStage && req.user.role !== "Department Head") {
      throw new ApiError(
        403,
        "Only the Department Head can decide this first-level approval.",
      );
    }
    if (isPaoStage && req.user.role !== "Property Administration Officer") {
      throw new ApiError(403, "Only the PAO can decide this senior approval.");
    }

    if (decision === "Approved") {
      const itemResult = await client.query(
        `SELECT name, qty_on_hand, disposal_reserved_qty
         FROM items WHERE id = $1 AND status = 'Active' FOR UPDATE`,
        [requisition.item_id],
      );
      if (itemResult.rows.length === 0)
        throw new ApiError(404, "Active item not found.");
      const item = itemResult.rows[0];
      const availableQty =
        Number(item.qty_on_hand) - Number(item.disposal_reserved_qty || 0);
      if (Number(requisition.qty) > availableQty) {
        throw new ApiError(
          400,
          `Insufficient stock for ${item.name}. Available quantity: ${availableQty}.`,
        );
      }
    }

    const nextStatus =
      decision === "Rejected"
        ? "Rejected"
        : isDepartmentStage
          ? "Pending PAO Approval"
          : "Approved";
    const approvalFields = isDepartmentStage
      ? "department_approved_by = $2, department_approved_at = now()"
      : "pao_approved_by = $2, pao_approved_at = now()";

    const updated = await client.query(
      `UPDATE store_requisitions SET status = $1, decided_by = $2, ${approvalFields}, decision_remarks = $3 WHERE id = $4 RETURNING *`,
      [nextStatus, req.user.id, req.body.remarks || null, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Requisition",
      action: `${decision} requisition ${requisition.ref_no} at ${isDepartmentStage ? "Department Head" : "PAO"} approval stage`,
    });
    await notifyRoles(client, {
      roles: isDepartmentStage
        ? ["Property Administration Officer"]
        : ["Store Head"],
      title: `Requisition ${decision.toLowerCase()}`,
      message: `${requisition.ref_no} is now ${nextStatus}.`,
      module: "Requisition",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, decide };
