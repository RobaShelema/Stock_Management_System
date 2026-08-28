const crypto = require("crypto");

const SEPARATOR = "\u001f";

function hashEntry({ previousHash, user, module, action, createdAt }) {
  return crypto
    .createHash("sha256")
    .update(
      [
        previousHash || "",
        user.id || "",
        user.name || "",
        user.role || "",
        module,
        action,
        createdAt,
      ].join(SEPARATOR),
    )
    .digest("hex");
}

// Writes an immutable, hash-linked audit log entry in the same transaction as
// the action it describes.
async function logAction(client, { user, module, action }) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [922337203]);
  const createdAt = new Date().toISOString();
  const previous = await client.query(
    `SELECT entry_hash FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 1`,
  );
  const previousHash = previous.rows[0]?.entry_hash || null;
  const entryHash = hashEntry({
    previousHash,
    user,
    module,
    action,
    createdAt,
  });
  await client.query(
    `INSERT INTO audit_logs (user_id, user_name, role, module, action, previous_hash, entry_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      user.id,
      user.name,
      user.role,
      module,
      action,
      previousHash,
      entryHash,
      createdAt,
    ],
  );
}

module.exports = { logAction, hashEntry };
