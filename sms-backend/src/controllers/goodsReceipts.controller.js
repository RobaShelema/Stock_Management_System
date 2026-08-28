const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { receiveLot } = require("../utils/fifo");
const { ensureBinCard, postBinCardEntry } = require("../utils/binCard");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");

async function list(req, res) {
  const storeIds = await assignedStoreIds(req.user);
  const scope = storeIds ? "WHERE gr.store_id = ANY($1::uuid[])" : "";
  const rows = await pool.query(
    `SELECT gr.*, s.name AS supplier_name, st.name AS store_name, i.name AS item_name,
            te.decision AS evaluation_decision, te.remarks AS evaluation_remarks, te.evaluated_at,
            g.grn_number, gr.expiry_date
     FROM goods_receipts gr
     JOIN suppliers s ON s.id = gr.supplier_id
     JOIN stores st ON st.id = gr.store_id
     JOIN items i ON i.id = gr.item_id
     LEFT JOIN technical_evaluations te ON te.entity_type = 'goods_receipt' AND te.entity_id = gr.id
     LEFT JOIN grns g ON g.goods_receipt_id = gr.id
    ${scope}
    ORDER BY gr.created_at DESC`,
    storeIds ? [storeIds] : [],
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { supplierId, storeId, itemId, qty, poReference, expiryDate } =
    req.body;
  if (!supplierId || !storeId || !itemId || !qty || !poReference) {
    throw new ApiError(
      400,
      "supplierId, storeId, itemId, qty, and poReference are required.",
    );
  }

  const result = await withTransaction(async (client) => {
    if (["Store Head", "Stock Clerk"].includes(req.user.role)) {
      const storeScope = await client.query(
        `SELECT 1 FROM stores WHERE id = $1 AND (head_user_id = $2 OR id = (SELECT store_id FROM users WHERE id = $2))`,
        [storeId, req.user.id],
      );
      if (!storeScope.rows.length) {
        // If user has no specific store assignment, allow them, otherwise require match
        const userStore = await client.query(
          `SELECT store_id FROM users WHERE id = $1`,
          [req.user.id],
        );
        if (
          userStore.rows[0]?.store_id &&
          userStore.rows[0]?.store_id !== storeId
        ) {
          throw new ApiError(
            403,
            "You are not assigned to the receiving store.",
          );
        }
      }
    }
    const refNo = generateRefNo("GR");
    const inserted = await client.query(
      `INSERT INTO goods_receipts (ref_no, supplier_id, store_id, item_id, qty, po_reference, expiry_date, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        refNo,
        supplierId,
        storeId,
        itemId,
        qty,
        poReference,
        expiryDate || null,
        req.user.id,
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Recorded goods receipt ${refNo}, pending TEC evaluation`,
    });
    await notifyRoles(client, {
      roles: ["Technical Evaluation Committee"],
      title: "Goods receipt awaiting evaluation",
      message: `Receipt ${refNo} is ready for technical inspection.`,
      module: "Goods Receipt",
      referenceId: inserted.rows[0].id,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function evaluate(req, res) {
  const { id } = req.params;
  const { decision, remarks } = req.body;
  if (!["Approved", "Rejected"].includes(decision)) {
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM goods_receipts WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Goods receipt not found.");
    if (current.rows[0].status !== "Awaiting Evaluation") {
      throw new ApiError(
        400,
        `Receipt is '${current.rows[0].status}' and cannot be re-evaluated.`,
      );
    }

    await client.query(
      `INSERT INTO technical_evaluations (entity_type, entity_id, evaluator_id, decision, remarks)
       VALUES ('goods_receipt', $1, $2, $3, $4)`,
      [id, req.user.id, decision, remarks || null],
    );

    const updated = await client.query(
      `UPDATE goods_receipts SET status = $1 WHERE id = $2 RETURNING *`,
      [decision, id],
    );

    await logAction(client, {
      user: req.user,
      module: "Technical Evaluation",
      action: `${decision} technical evaluation for ${current.rows[0].ref_no}`,
    });
    await notifyRoles(client, {
      roles: [
        "Property Registration Officer",
        "Property Administration Officer",
        "Store Head",
        "Administrator",
      ],
      title:
        decision === "Approved"
          ? "Goods Receipt Approved (Model 19 GRN Ready)"
          : "Goods Receipt Rejected by TEC",
      message: `Receipt ${current.rows[0].ref_no} was ${decision.toLowerCase()} by the Technical Evaluation Committee. Ready for Model 19 GRN generation.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });

    return updated.rows[0];
  });

  res.json(result);
}

async function generateGrn(req, res) {
  const { id } = req.params;
  const { unitCost, bin } = req.body || {};
  if (req.user.role !== "Property Registration Officer") {
    throw new ApiError(
      403,
      "Only the Property Registration Officer can generate an official GRN.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM goods_receipts WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Goods receipt not found.");
    const receipt = current.rows[0];
    if (receipt.status !== "Approved") {
      throw new ApiError(
        400,
        "GRN can only be generated for a receipt that TEC has Approved.",
      );
    }

    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await client.query(
      `INSERT INTO grns (goods_receipt_id, grn_number, generated_by) VALUES ($1, $2, $3)`,
      [id, grnNumber, req.user.id],
    );
    await client.query(
      `UPDATE goods_receipts SET status = 'GRN Generated' WHERE id = $1`,
      [id],
    );

    // Resolve unit cost: explicit override, else the item's default cost.
    let cost = Number(unitCost);
    if (!cost || isNaN(cost)) {
      const itemRes = await client.query(
        `SELECT default_unit_cost FROM items WHERE id = $1`,
        [receipt.item_id],
      );
      cost = parseFloat(itemRes.rows[0]?.default_unit_cost || 0);
    }

    await receiveLot(client, {
      itemId: receipt.item_id,
      sourceReference: grnNumber,
      qty: parseFloat(receipt.qty),
      unitCost: cost,
      expiryDate: receipt.expiry_date,
      userId: req.user.id,
    });

    const targetBin =
      bin && typeof bin === "string" && bin.trim() ? bin.trim() : "RECEIVING";
    const binCardId = await ensureBinCard(client, {
      storeId: receipt.store_id,
      bin: targetBin,
      itemId: receipt.item_id,
    });
    await postBinCardEntry(client, {
      binCardId,
      direction: "Inbound",
      reference: grnNumber,
      qty: parseFloat(receipt.qty),
    });

    await client.query(
      `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()`,
      [receipt.item_id, receipt.store_id, targetBin],
    );

    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Generated GRN ${grnNumber} for ${receipt.ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Store Head", "Property Administration Officer"],
      title: "GRN generated",
      message: `${grnNumber} was generated and stock was updated.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: "Success",
    });

    return { grnNumber, receiptId: id };
  });

  res.json(result);
}

module.exports = { list, create, evaluate, generateGrn };
