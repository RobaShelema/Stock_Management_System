const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

const GLOBAL_ROLES = new Set([
  "Administrator",
  "Property Administration Officer",
  "Property Registration Officer",
  "Accountant",
  "Disposal Committee",
  "Technical Evaluation Committee",
  "Campus Security Officer",
]);

async function assignedStoreIds(user) {
  if (GLOBAL_ROLES.has(user.role)) return null;
  let storeId = user.storeId;
  if (!storeId) {
    const assignment = await pool.query(
      `SELECT store_id FROM users WHERE id = $1`,
      [user.id],
    );
    storeId = assignment.rows[0]?.store_id;
  }
  const result = await pool.query(
    `SELECT id FROM stores WHERE head_user_id = $1 OR id = $2`,
    [user.id, storeId || null],
  );
  return result.rows.map((row) => row.id);
}

function requireAssignedStore(user, storeId) {
  if (GLOBAL_ROLES.has(user.role)) return;
  if (!user.storeId || user.storeId !== storeId) {
    throw new ApiError(403, "User is not assigned to this store.");
  }
}

async function requireDepartment(user, department) {
  if (GLOBAL_ROLES.has(user.role)) return;
  let assignedDepartment = user.department;
  if (!assignedDepartment) {
    const result = await pool.query(
      `SELECT department FROM users WHERE id = $1`,
      [user.id],
    );
    assignedDepartment = result.rows[0]?.department;
  }
  if (
    !assignedDepartment ||
    assignedDepartment.toLowerCase() !== String(department || "").toLowerCase()
  ) {
    throw new ApiError(403, "User is not assigned to this department.");
  }
}

module.exports = {
  assignedStoreIds,
  requireAssignedStore,
  requireDepartment,
  GLOBAL_ROLES,
};
