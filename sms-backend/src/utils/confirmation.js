const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

async function requireConfirmation(req) {
  const password = req.body?.confirmationPassword;
  if (!password)
    throw new ApiError(
      400,
      "Confirmation password is required for this action.",
    );
  const result = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1 AND status = 'Active'`,
    [req.user.id],
  );
  if (
    result.rows.length === 0 ||
    !(await bcrypt.compare(password, result.rows[0].password_hash))
  ) {
    throw new ApiError(401, "Confirmation password is incorrect.");
  }
}

module.exports = { requireConfirmation };
