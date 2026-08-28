const { pool } = require("../config/db");
const { hashEntry } = require("../utils/audit");

async function list(req, res) {
  const { module, user, from, to } = req.query;
  const conditions = [];
  const params = [];

  if (module) {
    params.push(module);
    conditions.push(`module = $${params.length}`);
  }
  if (user) {
    params.push(`%${user}%`);
    conditions.push(`user_name ILIKE $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`created_at <= $${params.length}`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await pool.query(
    `SELECT id, user_name, role, module, action, previous_hash, entry_hash, created_at FROM audit_logs ${where} ORDER BY created_at DESC LIMIT 500`,
    params,
  );
  res.json(rows.rows);
}

async function verifyChain(req, res) {
  const rows = await pool.query(
    `SELECT id, user_id, user_name, role, module, action, previous_hash, entry_hash, created_at
     FROM audit_logs ORDER BY created_at ASC, id ASC`,
  );
  let previousHash = null;
  let invalidAt = null;
  for (const row of rows.rows) {
    const expected = hashEntry({
      previousHash,
      user: { id: row.user_id, name: row.user_name, role: row.role },
      module: row.module,
      action: row.action,
      createdAt: new Date(row.created_at).toISOString(),
    });
    if (row.previous_hash !== previousHash || row.entry_hash !== expected) {
      invalidAt = row.id;
      break;
    }
    previousHash = row.entry_hash;
  }
  res.json({
    valid: invalidAt === null,
    checkedEntries: rows.rows.length,
    invalidAt,
  });
}

module.exports = { list, verifyChain };
