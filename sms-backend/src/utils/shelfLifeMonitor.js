const { pool } = require("../config/db");

// Recomputes lifecycle status from the earliest active FIFO lot. The view remains
// the source of truth for alerts, while this status supports dashboards and audit.
async function refreshShelfLifeStatuses(client = pool) {
  const result = await client.query(`
    WITH active_lots AS (
      SELECT item_id, MIN(expiry_date) AS next_expiry_date
      FROM cost_lots
      WHERE qty_remaining > 0 AND expiry_date IS NOT NULL
      GROUP BY item_id
    )
    UPDATE items i
    SET shelf_life_status = CASE
      WHEN COALESCE(al.next_expiry_date, i.expiry_date) < CURRENT_DATE THEN 'Expired'
      WHEN COALESCE(al.next_expiry_date, i.expiry_date) <= CURRENT_DATE + INTERVAL '7 days' THEN 'Near-Expiry'
      ELSE 'Available'
    END,
    updated_at = now()
    FROM active_lots al
    WHERE i.id = al.item_id AND i.status = 'Active'
    RETURNING i.id
  `);

  await client.query(`
    UPDATE items i
    SET shelf_life_status = CASE
      WHEN i.expiry_date < CURRENT_DATE THEN 'Expired'
      WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Near-Expiry'
      ELSE 'Available'
    END,
    updated_at = now()
    WHERE i.status = 'Active'
      AND NOT EXISTS (
        SELECT 1 FROM cost_lots cl
        WHERE cl.item_id = i.id AND cl.qty_remaining > 0 AND cl.expiry_date IS NOT NULL
      )
      AND i.expiry_date IS NOT NULL
  `);

  return { updatedItems: result.rowCount };
}

function startShelfLifeMonitor(intervalMs = 60 * 60 * 1000) {
  const run = () =>
    refreshShelfLifeStatuses().catch((error) => {
      console.error("Shelf-life monitor failed:", error.message);
    });
  run();
  return setInterval(run, intervalMs);
}

module.exports = { refreshShelfLifeStatuses, startShelfLifeMonitor };
