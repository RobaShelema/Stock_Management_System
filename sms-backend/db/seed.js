// Seeds the database with realistic university demo data.
// Run with: npm run seed  (after `npm run migrate`)
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/db");

const DEMO_PASSWORD = "Demo@1234";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Seeding users...");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userRows = [
      ["Abel Tesfaye", "abel.admin@university.edu", "Administrator"],
      [
        "Meron Alemu",
        "meron.pao@university.edu",
        "Property Administration Officer",
      ],
      ["Dawit Bekele", "dawit.store@university.edu", "Store Head"],
      ["Sara Getachew", "sara.clerk@university.edu", "Stock Clerk"],
      [
        "Yonas Kebede",
        "yonas.tec@university.edu",
        "Technical Evaluation Committee",
      ],
      [
        "Hana Girma",
        "hana.registration@university.edu",
        "Property Registration Officer",
      ],
      ["Tewodros Fikru", "tewodros.dept@university.edu", "Department Head"],
      ["Selam Mulu", "selam.acct@university.edu", "Accountant"],
      [
        "Disposal Committee Board",
        "disposal.committee@university.edu",
        "Disposal Committee",
      ],
      [
        "Girum Assefa",
        "girum.security@university.edu",
        "Campus Security Officer",
      ],
    ];
    const users = {};
    for (const [name, email, role] of userRows) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, department)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           status = 'Active',
           updated_at = now()
         RETURNING id, name, role`,
        [
          name,
          email,
          passwordHash,
          role,
          role === "Department Head" ? "Engineering College" : null,
        ],
      );
      users[role] = res.rows[0];
    }

    console.log("Seeding stores...");
    const storeRows = [
      ["MS-01", "Central Store", "Main Store", "Store Head"],
      ["DS-01", "Engineering College Store", "Department Store", "Store Head"],
      ["DS-02", "Science College Store", "Department Store", "Store Head"],
      ["CS-01", "Cafeteria Store", "Cafeteria Store", "Store Head"],
    ];
    const stores = {};
    for (const [code, name, type, headRole] of storeRows) {
      const res = await client.query(
        `INSERT INTO stores (code, name, type, head_user_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code, name`,
        [code, name, type, users[headRole].id],
      );
      stores[code] = res.rows[0];
    }
    await client.query(
      `UPDATE users SET store_id = $1 WHERE email = 'tewodros.dept@university.edu'`,
      [stores["DS-01"].id],
    );

    console.log("Seeding categories...");
    const categoryRows = [
      ["CAT-ELEC", "Electronics & IT Equipment", "DS-01"],
      ["CAT-STAT", "Office Stationery", "MS-01"],
      ["CAT-FURN", "Furniture", "MS-01"],
      ["CAT-LAB", "Laboratory Supplies", "DS-02"],
      ["CAT-FOOD", "Cafeteria Consumables", "CS-01"],
    ];
    const categories = {};
    for (const [code, name, storeCode] of categoryRows) {
      const res = await client.query(
        `INSERT INTO categories (code, name, store_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code`,
        [code, name, stores[storeCode].id],
      );
      categories[code] = res.rows[0];
    }

    console.log("Seeding suppliers...");
    const supplierRows = [
      [
        "University Office Supplies PLC",
        "Fikadu Wolde",
        "+251 911 223344",
        "sales@uosupplies.et",
      ],
      [
        "Horizon IT Solutions",
        "Betelhem Assefa",
        "+251 922 334455",
        "info@horizonit.et",
      ],
      [
        "Campus Furniture Manufacturing",
        "Samuel Tadesse",
        "+251 933 445566",
        "orders@campusfurniture.et",
      ],
    ];
    const suppliers = {};
    for (const [name, contact, phone, email] of supplierRows) {
      const res = await client.query(
        `INSERT INTO suppliers (name, contact, phone, email) VALUES ($1, $2, $3, $4) RETURNING id, name`,
        [name, contact, phone, email],
      );
      suppliers[name] = res.rows[0];
    }

    console.log("Seeding items...");
    const itemRows = [
      [
        "ITM-0001",
        "Dell Latitude 5440 Laptop",
        "CAT-ELEC",
        "Piece",
        "Fixed Asset",
        5,
        2,
        12,
        68000,
      ],
      [
        "ITM-0002",
        "HP LaserJet Toner Cartridge",
        "CAT-STAT",
        "Piece",
        "Consumable",
        10,
        4,
        6,
        3200,
      ],
      [
        "ITM-0003",
        "Ergonomic Office Chair",
        "CAT-FURN",
        "Piece",
        "Fixed Asset",
        3,
        1,
        8,
        9500,
      ],
      [
        "ITM-0004",
        "A4 Photocopy Paper (Ream)",
        "CAT-STAT",
        "Ream",
        "Consumable",
        50,
        20,
        34,
        380,
      ],
      [
        "ITM-0005",
        "Network Switch 24-Port",
        "CAT-ELEC",
        "Piece",
        "Fixed Asset",
        2,
        1,
        3,
        21000,
      ],
      [
        "ITM-0006",
        "Laboratory Glassware Set",
        "CAT-LAB",
        "Set",
        "Consumable",
        15,
        5,
        9,
        1450,
      ],
      [
        "ITM-0007",
        "Bottled Drinking Water (Carton)",
        "CAT-FOOD",
        "Carton",
        "Consumable",
        20,
        8,
        18,
        600,
      ],
    ];
    const items = {};
    for (const [
      code,
      name,
      catCode,
      unit,
      type,
      reorder,
      safety,
      qty,
      cost,
    ] of itemRows) {
      const res = await client.query(
        `INSERT INTO items (code, name, category_id, unit, type, reorder_level, safety_stock_level, qty_on_hand, default_unit_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code, name`,
        [
          code,
          name,
          categories[catCode].id,
          unit,
          type,
          reorder,
          safety,
          qty,
          cost,
        ],
      );
      items[code] = res.rows[0];

      // Give every item an opening FIFO cost lot matching its opening qty.
      await client.query(
        `INSERT INTO cost_lots (item_id, source_reference, qty_received, qty_remaining, unit_cost, received_at)
         VALUES ($1, $2, $3, $4, $5, now() - interval '30 days')`,
        [items[code].id, "OPENING-BALANCE", qty, qty, cost],
      );
      await client.query(
        `INSERT INTO stock_card_entries (item_id, type, qty, balance, cost_amount, reference, created_by, created_at)
         VALUES ($1, 'Receipt', $2, $2, $3, 'OPENING-BALANCE', $4, now() - interval '30 days')`,
        [items[code].id, qty, qty * cost, users["Administrator"].id],
      );
    }

    console.log("Seeding item locations and bin cards...");
    const locationRows = [
      ["ITM-0001", "DS-01", "BIN-A1"],
      ["ITM-0002", "MS-01", "BIN-C3"],
      ["ITM-0003", "MS-01", "BIN-B2"],
      ["ITM-0004", "MS-01", "BIN-C1"],
      ["ITM-0005", "DS-01", "BIN-A2"],
      ["ITM-0006", "DS-02", "BIN-L1"],
      ["ITM-0007", "CS-01", "BIN-F1"],
    ];
    for (const [itemCode, storeCode, bin] of locationRows) {
      await client.query(
        `INSERT INTO item_locations (item_id, store_id, bin) VALUES ($1, $2, $3)
         ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin`,
        [items[itemCode].id, stores[storeCode].id, bin],
      );
      const binCardRes = await client.query(
        `INSERT INTO bin_cards (store_id, bin, item_id) VALUES ($1, $2, $3)
         ON CONFLICT (store_id, bin, item_id) DO UPDATE SET bin = EXCLUDED.bin
         RETURNING id`,
        [stores[storeCode].id, bin, items[itemCode].id],
      );
      const openingQty = itemRows.find((r) => r[0] === itemCode)[7];
      await client.query(
        `INSERT INTO bin_card_entries (bin_card_id, direction, reference, qty, balance, created_at)
         VALUES ($1, 'Inbound', 'OPENING-BALANCE', $2, $2, now() - interval '30 days')`,
        [binCardRes.rows[0].id, openingQty],
      );
    }

    console.log("Seeding a sample goods receipt pending evaluation...");
    await client.query(
      `INSERT INTO goods_receipts (ref_no, supplier_id, store_id, item_id, qty, po_reference, status, recorded_by)
       VALUES ('GR-2026-014', $1, $2, $3, 5, 'PO-2026-0091', 'Awaiting Evaluation', $4)`,
      [
        suppliers["Horizon IT Solutions"].id,
        stores["DS-01"].id,
        items["ITM-0001"].id,
        users["Store Head"].id,
      ],
    );

    console.log("Seeding a sample approved requisition...");
    await client.query(
      `INSERT INTO store_requisitions (ref_no, department, requested_by, store_id, item_id, qty, status, decided_by)
       VALUES ('SR-2026-0209', 'Facilities', $1, $2, $3, 5, 'Approved', $4)`,
      [
        users["Department Head"].id,
        stores["DS-02"].id,
        items["ITM-0006"].id,
        users["Property Administration Officer"].id,
      ],
    );

    console.log("Seeding a sample fixed asset and custody...");
    const faRes = await client.query(
      `INSERT INTO fixed_assets (tag, item_id, custodian_name, department, acquisition_date, value, registered_by)
       VALUES ('FA-2026-0044', $1, 'Tewodros Fikru', 'Engineering College', now() - interval '20 days', 68000, $2)
       RETURNING id`,
      [items["ITM-0001"].id, users["Property Registration Officer"].id],
    );

    console.log("Seeding a sample audit trail entry...");
    await client.query(
      `INSERT INTO audit_logs (user_id, user_name, role, module, action)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        users["Administrator"].id,
        users["Administrator"].name,
        "Administrator",
        "System",
        "Database seeded with initial demo data",
      ],
    );

    await client.query("COMMIT");
    console.log("\nSeed complete.");
    console.log("Demo login password for every account:", DEMO_PASSWORD);
    console.log("Demo accounts:");
    for (const [name, email, role] of userRows) {
      console.log(`  ${email}  (${role})`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed, rolled back:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
