const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const REPORT_QUERIES = {
  "stock-status": `SELECT i.code, i.name, c.name AS category, i.qty_on_hand, i.reorder_level, i.unit,
                           (i.qty_on_hand * i.default_unit_cost) AS estimated_value
                    FROM items i JOIN categories c ON c.id = i.category_id
                    ORDER BY i.name`,
  "stock-valuation": `SELECT i.code, i.name, c.name AS category, i.qty_on_hand, i.unit,
                             COALESCE(SUM(cl.qty_remaining * cl.unit_cost), 0) AS total_valuation,
                             CASE WHEN i.qty_on_hand <= i.safety_stock_level THEN 'Critical (Safety Stock)'
                                  WHEN i.qty_on_hand <= i.reorder_level THEN 'Reorder Warning'
                                  ELSE 'Optimal' END AS stock_health
                      FROM items i JOIN categories c ON c.id = i.category_id
                      LEFT JOIN cost_lots cl ON cl.item_id = i.id AND cl.qty_remaining > 0
                      GROUP BY i.id, i.code, i.name, c.name, i.qty_on_hand, i.unit, i.safety_stock_level, i.reorder_level
                      ORDER BY total_valuation DESC`,
  "material-movements": `SELECT sce.created_at, i.code, i.name AS item_name, sce.type, sce.qty, sce.balance,
                                sce.cost_amount, sce.reference, u.name AS processed_by
                         FROM stock_card_entries sce
                         JOIN items i ON i.id = sce.item_id
                         LEFT JOIN users u ON u.id = sce.created_by
                         ORDER BY sce.created_at DESC LIMIT 500`,
  "stock-take-reconciliation": `SELECT st.scheduled_date, s.name AS store_name, u.name AS scheduled_by,
                                       st.status, stl.counted_qty, stl.system_qty, (stl.counted_qty - stl.system_qty) AS discrepancy,
                                       i.code AS item_code, i.name AS item_name
                                FROM stock_takes st
                                JOIN stores s ON s.id = st.store_id
                                LEFT JOIN users u ON u.id = st.scheduled_by
                                LEFT JOIN stock_take_lines stl ON stl.stock_take_id = st.id
                                LEFT JOIN items i ON i.id = stl.item_id
                                ORDER BY st.scheduled_date DESC LIMIT 500`,
  "fixed-asset-register": `SELECT fa.tag, i.name AS item_name, fa.custodian_name, fa.department, fa.value, fa.status
                            FROM fixed_assets fa JOIN items i ON i.id = fa.item_id
                            ORDER BY fa.acquisition_date DESC`,
  "supplier-summary": `SELECT name, contact, phone, email, status FROM suppliers ORDER BY name`,
  "disposal-summary": `SELECT dr.ref_no, i.name AS item_name, dr.qty, dr.status, dr.method,
                                dr.financial_write_off_amount, dr.financial_write_off_at,
                                dr.created_at
                        FROM disposal_requests dr JOIN items i ON i.id = dr.item_id
                        ORDER BY dr.created_at DESC`,
  "requisition-summary": `SELECT sr.ref_no, sr.department, i.name AS item_name, sr.qty, sr.status, sr.created_at
                           FROM store_requisitions sr JOIN items i ON i.id = sr.item_id
                           ORDER BY sr.created_at DESC`,
};

async function generate(req, res) {
  const { type } = req.params;
  const sql = REPORT_QUERIES[type];
  if (!sql) {
    throw new ApiError(
      400,
      `Unknown report type '${type}'. Valid types: ${Object.keys(REPORT_QUERIES).join(", ")}`,
    );
  }
  const rows = await pool.query(sql);
  res.json(rows.rows);
}

async function exportReport(req, res) {
  const { type, format } = req.params;
  const sql = REPORT_QUERIES[type];
  if (!sql) throw new ApiError(400, `Unknown report type '${type}'.`);
  if (!["xlsx", "pdf"].includes(format)) {
    throw new ApiError(400, "Supported export formats are xlsx and pdf.");
  }

  const result = await pool.query(sql);
  const rows = result.rows;
  const fileName = `${type}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : ["message"];
    sheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 4, 14), 32),
    }));
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF17324D" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    return res.end();
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.pdf"`,
  );
  const document = new PDFDocument({
    margin: 36,
    layout: "landscape",
    size: "A4",
  });
  document.pipe(res);
  document
    .fontSize(16)
    .fillColor("#17324d")
    .text(`Stock Management Report: ${type}`, { align: "center" });
  document
    .moveDown(0.5)
    .fontSize(8)
    .fillColor("#555")
    .text(`Generated ${new Date().toLocaleString()}`, { align: "center" });
  document.moveDown();

  const headers = rows.length > 0 ? Object.keys(rows[0]) : ["message"];
  const pageWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right;
  const columnWidth = pageWidth / headers.length;
  let y = document.y;
  const drawRow = (values, bold = false) => {
    if (y > document.page.height - 48) {
      document.addPage();
      y = document.page.margins.top;
    }
    values.forEach((value, index) => {
      document
        .fontSize(7)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor("#222")
        .text(
          String(value ?? ""),
          document.page.margins.left + index * columnWidth,
          y,
          { width: columnWidth - 4, height: 18, ellipsis: true },
        );
    });
    y += 20;
  };
  drawRow(headers, true);
  rows.forEach((row) => drawRow(headers.map((header) => row[header])));
  document.end();
}

module.exports = { generate, exportReport };
