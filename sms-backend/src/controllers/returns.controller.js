const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { receiveLot } = require("../utils/fifo");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const conditions = [];
  const params = [];

  if (req.user.role === "Department Head") {
    if (req.user.department) {
      params.push(req.user.department);
      conditions.push(`(LOWER(COALESCE(srn.department, sr.department, '')) = LOWER($${params.length}))`);
    }
  } else if (req.user.role === "Requesting Staff") {
    params.push(req.user.id);
    conditions.push(`srn.returned_by = $${params.length}`);
  } else {
    const storeIds = await assignedStoreIds(req.user);
    if (storeIds) {
      params.push(storeIds);
      conditions.push(`iv.store_id = ANY($${params.length}::uuid[])`);
    }
  }

  const scope = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await pool.query(
    `SELECT srn.*, i.name AS item_name, u.name AS returned_by_name,
          COALESCE(srn.department, sr.department) AS department,
          iv.ref_no AS source_voucher_ref,
          te.decision AS evaluation_condition, te.remarks AS evaluation_remarks
     FROM store_return_notes srn
     JOIN items i ON i.id = srn.item_id
     JOIN users u ON u.id = srn.returned_by
    LEFT JOIN issue_vouchers iv ON iv.id = srn.source_issue_voucher_id
    LEFT JOIN store_requisitions sr ON sr.id = iv.requisition_id
     LEFT JOIN technical_evaluations te ON te.entity_type = 'store_return' AND te.entity_id = srn.id
    ${scope}
     ORDER BY srn.created_at DESC`,
    params,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { itemId, qty, reason, sourceIssueVoucherId } = req.body;
  if (!itemId || !qty || !reason || !sourceIssueVoucherId)
    throw new ApiError(
      400,
      "itemId, qty, reason, and sourceIssueVoucherId are required.",
    );

  const result = await withTransaction(async (client) => {
    const voucherResult = await client.query(
      `SELECT iv.*, sr.requested_by, sr.department AS req_department
       FROM issue_vouchers iv
       JOIN store_requisitions sr ON sr.id = iv.requisition_id
       WHERE iv.id = $1 FOR UPDATE`,
      [sourceIssueVoucherId],
    );
    if (voucherResult.rows.length === 0)
      throw new ApiError(404, "Source issue voucher not found.");
    const voucher = voucherResult.rows[0];
    if (voucher.status !== "Issued" || voucher.model !== "Model 22 (Final)") {
      throw new ApiError(
        400,
        "Returns can only reference a finalized Model 22 issue voucher.",
      );
    }
    if (voucher.item_id !== itemId)
      throw new ApiError(
        400,
        "Returned item does not match the source issue voucher.",
      );
    if (
      req.user.role === "Requesting Staff" &&
      voucher.requested_by !== req.user.id
    ) {
      throw new ApiError(
        403,
        "Staff may only return materials issued to their own request.",
      );
    }
    const returned = await client.query(
      `SELECT COALESCE(SUM(qty), 0) AS total_returned
       FROM store_return_notes
       WHERE source_issue_voucher_id = $1 AND status <> 'Rejected'`,
      [sourceIssueVoucherId],
    );
    const totalReturned = Number(returned.rows[0].total_returned || 0);
    if (totalReturned + Number(qty) > Number(voucher.qty)) {
      throw new ApiError(
        400,
        `Return exceeds the issued quantity. Remaining returnable quantity: ${Number(voucher.qty) - totalReturned}.`,
      );
    }
    const returnDepartment = req.user.department || voucher.req_department || "Academic Department";
    const refNo = generateRefNo("SRN");
    const inserted = await client.query(
      `INSERT INTO store_return_notes (ref_no, item_id, qty, source_issue_voucher_id, returned_by, reason, status, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        refNo,
        itemId,
        qty,
        sourceIssueVoucherId,
        req.user.id,
        reason,
        req.user.role === "Requesting Staff"
          ? "Pending Department Approval"
          : "Pending Technical Evaluation",
        returnDepartment,
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `Created return request ${refNo}`,
    });
    await notifyRoles(client, {
      roles:
        req.user.role === "Requesting Staff"
          ? ["Department Head"]
          : ["Technical Evaluation Committee"],
      title: "Material return awaiting review",
      message: `Return ${refNo} requires the next workflow review.`,
      module: "Returns",
      referenceId: inserted.rows[0].id,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function evaluate(req, res) {
  const { id } = req.params;
  const { condition, remarks } = req.body;
  if (!["Serviceable", "Damaged", "Obsolete"].includes(condition)) {
    throw new ApiError(
      400,
      "condition must be 'Serviceable', 'Damaged', or 'Obsolete'.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM store_return_notes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "Return not found.");
    if (current.rows[0].status !== "Pending Technical Evaluation") {
      throw new ApiError(
        400,
        `Return is '${current.rows[0].status}' and cannot be re-evaluated.`,
      );
    }

    await client.query(
      `INSERT INTO technical_evaluations (entity_type, entity_id, evaluator_id, decision, remarks)
       VALUES ('store_return', $1, $2, $3, $4)`,
      [id, req.user.id, condition, remarks || null],
    );
    const updated = await client.query(
      `UPDATE store_return_notes SET status = 'Evaluated', condition = $1 WHERE id = $2 RETURNING *`,
      [condition, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `Recorded technical evaluation (${condition}) for ${current.rows[0].ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Property Administration Officer", "Store Head"],
      title: "Material return evaluated",
      message: `Return ${current.rows[0].ref_no} is ready for a final decision.`,
      module: "Returns",
      referenceId: id,
      severity: condition === "Serviceable" ? "Success" : "Warning",
    });
    return updated.rows[0];
  });

  res.json(result);
}

async function decide(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  if (!["Approved", "Rejected"].includes(decision))
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");

  // Only require password confirmation for senior final decisions (PAO / Store Head),
  // NOT for Department Head first-level approvals
  if (["Property Administration Officer", "Store Head"].includes(req.user.role)) {
    await requireConfirmation(req);
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM store_return_notes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "Return not found.");
    const note = current.rows[0];
    if (note.status === "Pending Department Approval") {
      if (req.user.role !== "Department Head") {
        throw new ApiError(
          403,
          "Only the Department Head can approve this return before technical evaluation.",
        );
      }
      if (decision === "Rejected") {
        const rejected = await client.query(
          `UPDATE store_return_notes SET status = 'Rejected', decided_by = $1, decision_remarks = $2 WHERE id = $3 RETURNING *`,
          [req.user.id, req.body.remarks || null, id],
        );
        await logAction(client, {
          user: req.user,
          module: "Returns",
          action: `Rejected return ${note.ref_no} at Department Head approval stage`,
        });
        return rejected.rows[0];
      }
      const routed = await client.query(
        `UPDATE store_return_notes SET status = 'Pending Technical Evaluation', department_approved_by = $1, department_approved_at = now(), decision_remarks = $2 WHERE id = $3 RETURNING *`,
        [req.user.id, req.body.remarks || null, id],
      );
      await logAction(client, {
        user: req.user,
        module: "Returns",
        action: `Approved return ${note.ref_no} at Department Head approval stage and routed to TEC`,
      });
      await notifyRoles(client, {
        roles: ["Technical Evaluation Committee"],
        title: "Material return approved for TEC review",
        message: `Return ${note.ref_no} was approved by the Department Head and routed to TEC.`,
        module: "Returns",
        referenceId: id,
      });
      return routed.rows[0];
    }
    if (note.status !== "Evaluated")
      throw new ApiError(
        400,
        "Return must be Evaluated before a final decision can be recorded.",
      );
    if (
      !["Property Administration Officer", "Store Head"].includes(req.user.role)
    ) {
      throw new ApiError(
        403,
        "Only PAO or Store Head can decide an evaluated return.",
      );
    }

    const updated = await client.query(
      `UPDATE store_return_notes SET status = $1, decided_by = $2 WHERE id = $3 RETURNING *`,
      [decision, req.user.id, id],
    );

    if (decision === "Approved" && note.condition === "Serviceable") {
      const itemRes = await client.query(
        `SELECT default_unit_cost FROM items WHERE id = $1`,
        [note.item_id],
      );
      await receiveLot(client, {
        itemId: note.item_id,
        sourceReference: note.ref_no,
        qty: parseFloat(note.qty),
        unitCost: parseFloat(itemRes.rows[0]?.default_unit_cost || 0),
        type: "Return",
        userId: req.user.id,
      });
    } else if (decision === "Rejected" || note.condition !== "Serviceable") {
      // Route damaged/obsolete or rejected returns into the disposal workflow.
      const disposalRef = `DR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      await client.query(
        `INSERT INTO disposal_requests (ref_no, item_id, qty, reason, flagged_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          disposalRef,
          note.item_id,
          note.qty,
          `Routed from store return ${note.ref_no} (${note.condition || "rejected"})`,
          req.user.id,
        ],
      );
    }

    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `${decision} store return ${note.ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Department Head", "Store Head"],
      title: `Material return ${decision.toLowerCase()}`,
      message: `Return ${note.ref_no} was ${decision.toLowerCase()}.`,
      module: "Returns",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, evaluate, decide };
