const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and password are required.");

  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  const user = result.rows[0];

  if (!user || user.status !== "Active") {
    throw new ApiError(401, "Invalid credentials or inactive account.");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, "Invalid credentials.");

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.store_id,
    department: user.department,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

  await withTransaction((client) =>
    logAction(client, {
      user: payload,
      module: "Authentication",
      action: "Logged in",
    }),
  );

  res.json({ token, user: payload });
}

async function logout(req, res) {
  // JWTs are stateless: the client discards the token. We still record the
  // action for the audit trail.
  await withTransaction((client) =>
    logAction(client, {
      user: req.user,
      module: "Authentication",
      action: "Logged out",
    }),
  );
  res.json({ message: "Logged out." });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };
