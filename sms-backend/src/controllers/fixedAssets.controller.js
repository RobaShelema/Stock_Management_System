const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");
const { assignedStoreIds } = require("../utils/scope");

async function list(req, res) {
  let scope = "";
  let scopeParams = [];

  if (req.user.role === "Department Head" && req.user.department) {
    scope = "WHERE LOWER(fa.department) = LOWER($1)";
    scopeParams = [req.user.department];
  } else {
    const storeIds = await assignedStoreIds(req.user);
    if (storeIds && storeIds.length > 0) {
      scope =
        "WHERE EXISTS (SELECT 1 FROM goods_receipts gr WHERE gr.id = fa.goods_receipt_id AND gr.store_id = ANY($1::uuid[]))";
      scopeParams = [storeIds];
    }
  }

  const rows = await pool.query(
    `SELECT fa.*, i.name AS item_name
     FROM fixed_assets fa JOIN items i ON i.id = fa.item_id
    ${scope}
    ORDER BY fa.created_at DESC`,
    scopeParams,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const {
    tag,
    itemId,
    custodianName,
    department,
    acquisitionDate,
    value,
    goodsReceiptId,
  } = req.body;
  if (
    !tag ||
    !itemId ||
    !custodianName ||
    !department ||
    !acquisitionDate ||
    value === undefined
  ) {
    throw new ApiError(
      400,
      "tag, itemId, custodianName, department, acquisitionDate, and value are required.",
    );
  }

  const result = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO fixed_assets (tag, item_id, custodian_name, department, acquisition_date, value, goods_receipt_id, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tag,
        itemId,
        custodianName,
        department,
        acquisitionDate,
        value,
        goodsReceiptId || null,
        req.user.id,
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Fixed Assets",
      action: `Registered fixed asset ${tag} to ${custodianName} (${department})`,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function reassign(req, res) {
  const { id } = req.params;
  const { custodianName, department, reason } = req.body || {};
  if (!custodianName || !department || !reason) {
    throw new ApiError(
      400,
      "custodianName, department, and reason are required.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM fixed_assets WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Fixed asset not found.");
    if (current.rows[0].status === "Disposed")
      throw new ApiError(400, "A disposed asset cannot be reassigned.");

    const asset = current.rows[0];
    const updated = await client.query(
      `UPDATE fixed_assets SET custodian_name = $1, department = $2, status = 'Transferred' WHERE id = $3 RETURNING *`,
      [custodianName, department, id],
    );
    await client.query(
      `INSERT INTO fixed_asset_custody_history
       (fixed_asset_id, from_custodian_name, from_department, to_custodian_name, to_department, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        asset.custodian_name,
        asset.department,
        custodianName,
        department,
        req.user.id,
        reason,
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Fixed Assets",
      action: `Reassigned fixed asset ${asset.tag} from ${asset.custodian_name} to ${custodianName}`,
    });
    return updated.rows[0];
  });
  res.json(result);
}

async function verify(req, res) {
  const { id } = req.params;
  const { verificationStatus = "Verified", remarks } = req.body || {};
  if (!["Verified", "Exception"].includes(verificationStatus)) {
    throw new ApiError(
      400,
      "verificationStatus must be 'Verified' or 'Exception'.",
    );
  }

  const result = await withTransaction(async (client) => {
    const asset = await client.query(
      `SELECT * FROM fixed_assets WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (asset.rows.length === 0)
      throw new ApiError(404, "Fixed asset not found.");
    const inserted = await client.query(
      `INSERT INTO fixed_asset_verifications (fixed_asset_id, verified_by, verification_status, remarks)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.id, verificationStatus, remarks || null],
    );
    await client.query(
      `UPDATE fixed_assets SET last_verified_at = now() WHERE id = $1`,
      [id],
    );
    await logAction(client, {
      user: req.user,
      module: "Fixed Assets",
      action: `${verificationStatus} physical verification for fixed asset ${asset.rows[0].tag}`,
    });
    return inserted.rows[0];
  });
  res.status(201).json(result);
}

async function history(req, res) {
  const asset = await pool.query(`SELECT id FROM fixed_assets WHERE id = $1`, [
    req.params.id,
  ]);
  if (asset.rows.length === 0)
    throw new ApiError(404, "Fixed asset not found.");
  const [custody, verifications] = await Promise.all([
    pool.query(
      `SELECT h.*, u.name AS changed_by_name FROM fixed_asset_custody_history h JOIN users u ON u.id = h.changed_by WHERE h.fixed_asset_id = $1 ORDER BY h.changed_at DESC`,
      [req.params.id],
    ),
    pool.query(
      `SELECT v.*, u.name AS verified_by_name FROM fixed_asset_verifications v JOIN users u ON u.id = v.verified_by WHERE v.fixed_asset_id = $1 ORDER BY v.verified_at DESC`,
      [req.params.id],
    ),
  ]);
  res.json({ custodyHistory: custody.rows, verifications: verifications.rows });
}

// Use Case: Manage User-Card — computed from the user_cards_view, always
// exactly consistent with the fixed_assets table (see db/schema.sql).
async function userCards(req, res) {
  const isDepartmentHead =
    req.user.role === "Department Head" && req.user.department;
  const rows = await pool.query(
    `SELECT * FROM user_cards_view ${isDepartmentHead ? "WHERE LOWER(department) = LOWER($1)" : ""} ORDER BY custodian_name`,
    isDepartmentHead ? [req.user.department] : [],
  );
  res.json(rows.rows);
}

module.exports = { list, create, reassign, verify, history, userCards };
