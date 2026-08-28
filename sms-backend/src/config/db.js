const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
});

pool.on("error", (err) => {
  // Prevents an idle client error from crashing the whole process.
  console.error("Unexpected PostgreSQL pool error:", err);
});

// Simple query helper: query(text, params) -> rows
async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// Runs `fn` inside a single transaction using one client from the pool.
// `fn` receives a client with the same `.query(text, params)` signature.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
