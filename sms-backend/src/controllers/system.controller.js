const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");

// Ensure system_settings table exists
async function ensureSettingsTable(client = pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by UUID REFERENCES users(id)
    )
  `);
}

const DEFAULT_SETTINGS = {
  institutionName: "University of Technology and Science",
  directorate: "ICT Directorate & Property Administration",
  currency: "ETB",
  fiscalYear: "2025/2026",
  reorderAlertThresholdDays: 7,
  backupSchedule: "Daily at 00:00 UTC",
  auditRetentionDays: 365,
  sessionTimeoutMinutes: 60,
  maintenanceMode: false,
  allowDelegatedSuppliers: true,
};

async function getHealth(req, res) {
  const startTime = Date.now();
  let dbStatus = "Connected";
  let dbLatencyMs = 0;
  let counts = {};

  try {
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - startTime;

    const countQueries = await Promise.all([
      pool.query("SELECT count(*)::int AS count FROM users"),
      pool.query("SELECT count(*)::int AS count FROM stores"),
      pool.query("SELECT count(*)::int AS count FROM items"),
      pool.query("SELECT count(*)::int AS count FROM suppliers"),
      pool.query("SELECT count(*)::int AS count FROM goods_receipts"),
      pool.query("SELECT count(*)::int AS count FROM store_requisitions"),
      pool.query("SELECT count(*)::int AS count FROM audit_logs"),
    ]);

    counts = {
      users: countQueries[0].rows[0]?.count || 0,
      stores: countQueries[1].rows[0]?.count || 0,
      items: countQueries[2].rows[0]?.count || 0,
      suppliers: countQueries[3].rows[0]?.count || 0,
      goodsReceipts: countQueries[4].rows[0]?.count || 0,
      requisitions: countQueries[5].rows[0]?.count || 0,
      auditLogs: countQueries[6].rows[0]?.count || 0,
    };
  } catch (err) {
    dbStatus = `Disconnected: ${err.message}`;
  }

  const mem = process.memoryUsage();

  res.json({
    status: dbStatus === "Connected" ? "Healthy" : "Degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      poolTotal: pool.totalCount || 1,
      poolIdle: pool.idleCount || 0,
      poolWaiting: pool.waitingCount || 0,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      memoryHeapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    },
    counts,
  });
}

async function triggerBackup(req, res) {
  const timestamp = new Date().toISOString();
  const backupId = `BACKUP-${Date.now()}`;

  const result = await withTransaction(async (client) => {
    await ensureSettingsTable(client);

    // Fetch snapshot of critical tables
    const [users, stores, categories, items, suppliers, receipts, requisitions, vouchers, assets, logs, settings] =
      await Promise.all([
        client.query("SELECT id, name, email, role, status, created_at FROM users"),
        client.query("SELECT * FROM stores"),
        client.query("SELECT * FROM categories"),
        client.query("SELECT * FROM items"),
        client.query("SELECT * FROM suppliers"),
        client.query("SELECT * FROM goods_receipts"),
        client.query("SELECT * FROM store_requisitions"),
        client.query("SELECT * FROM issue_vouchers"),
        client.query("SELECT * FROM fixed_assets"),
        client.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500"),
        client.query("SELECT * FROM system_settings"),
      ]);

    const backupData = {
      backupId,
      timestamp,
      version: "1.0.0",
      generatedBy: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
      counts: {
        users: users.rowCount,
        stores: stores.rowCount,
        categories: categories.rowCount,
        items: items.rowCount,
        suppliers: suppliers.rowCount,
        goodsReceipts: receipts.rowCount,
        requisitions: requisitions.rowCount,
        issueVouchers: vouchers.rowCount,
        fixedAssets: assets.rowCount,
        auditLogs: logs.rowCount,
      },
      tables: {
        users: users.rows,
        stores: stores.rows,
        categories: categories.rows,
        items: items.rows,
        suppliers: suppliers.rows,
        goodsReceipts: receipts.rows,
        requisitions: requisitions.rows,
        issueVouchers: vouchers.rows,
        fixedAssets: assets.rows,
        auditLogs: logs.rows,
        systemSettings: settings.rows,
      },
    };

    await logAction(client, {
      user: req.user,
      module: "System & Backups",
      action: `Triggered data backup ${backupId} (${users.rowCount} users, ${items.rowCount} items, ${logs.rowCount} audit records)`,
    });

    return backupData;
  });

  res.status(201).json(result);
}

async function getSettings(req, res) {
  await ensureSettingsTable();
  const rows = await pool.query("SELECT key, value FROM system_settings");
  const stored = {};
  for (const r of rows.rows) {
    stored[r.key] = r.value;
  }
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  res.json(merged);
}

async function updateSettings(req, res) {
  const updates = req.body || {};

  const result = await withTransaction(async (client) => {
    await ensureSettingsTable(client);

    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO system_settings (key, value, updated_at, updated_by)
         VALUES ($1, $2, now(), $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
        [key, JSON.stringify(value), req.user.id]
      );
    }

    await logAction(client, {
      user: req.user,
      module: "System Settings",
      action: `Updated system-wide settings (${Object.keys(updates).join(", ")})`,
    });

    const rows = await client.query("SELECT key, value FROM system_settings");
    const stored = {};
    for (const r of rows.rows) {
      stored[r.key] = r.value;
    }
    return { ...DEFAULT_SETTINGS, ...stored };
  });

  res.json(result);
}

module.exports = { getHealth, triggerBackup, getSettings, updateSettings };
