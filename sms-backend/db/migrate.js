// Applies db/schema.sql to the configured database.
// Run with: npm run migrate
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  console.log("Applying schema.sql...");
  try {
    await pool.query(sql);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
