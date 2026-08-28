const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");
const { pool } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const storesRoutes = require("./routes/stores.routes");
const categoriesRoutes = require("./routes/categories.routes");
const itemLocationsRoutes = require("./routes/itemLocations.routes");
const itemsRoutes = require("./routes/items.routes");
const suppliersRoutes = require("./routes/suppliers.routes");
const goodsReceiptsRoutes = require("./routes/goodsReceipts.routes");
const stockCardsRoutes = require("./routes/stockCards.routes");
const binCardsRoutes = require("./routes/binCards.routes");
const requisitionsRoutes = require("./routes/requisitions.routes");
const issueVouchersRoutes = require("./routes/issueVouchers.routes");
const fixedAssetsRoutes = require("./routes/fixedAssets.routes");
const returnsRoutes = require("./routes/returns.routes");
const transfersRoutes = require("./routes/transfers.routes");
const disposalRoutes = require("./routes/disposal.routes");
const stockControlRoutes = require("./routes/stockControl.routes");
const reportsRoutes = require("./routes/reports.routes");
const auditLogsRoutes = require("./routes/auditLogs.routes");
const systemRoutes = require("./routes/system.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin))
              return callback(null, true);
            return callback(new Error("Origin is not allowed by CORS."));
          }
        : true,
  }),
);
app.use(helmet());
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (durationMs > 3000) {
      console.warn(
        `Slow request: ${req.method} ${req.originalUrl} took ${durationMs.toFixed(1)}ms`,
      );
    }
  });
  next();
});
if (
  process.env.NODE_ENV === "production" &&
  process.env.TLS_TERMINATED_BY_PROXY !== "true"
) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(`https://${req.get("host")}${req.originalUrl}`);
  });
}
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (req, res) =>
  res.json({
    message: "SPMS Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      stores: "/api/stores",
      categories: "/api/categories",
      items: "/api/items",
      suppliers: "/api/suppliers",
      goodsReceipts: "/api/goods-receipts",
      stockCards: "/api/stock-cards",
      binCards: "/api/bin-cards",
      requisitions: "/api/requisitions",
      issueVouchers: "/api/issue-vouchers",
      fixedAssets: "/api/fixed-assets",
      returns: "/api/returns",
      transfers: "/api/transfers",
      disposal: "/api/disposal-requests",
      stockControl: "/api/stock-control",
      reports: "/api/reports",
      auditLogs: "/api/audit-logs",
      system: "/api/system",
      notifications: "/api/notifications",
    },
  }),
);

app.get("/api/health", async (req, res) => {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "ok",
      dbLatencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      database: "unavailable",
      error: error.message,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
});

app.get("/api/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/item-locations", itemLocationsRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/goods-receipts", goodsReceiptsRoutes);
app.use("/api/stock-cards", stockCardsRoutes);
app.use("/api/bin-cards", binCardsRoutes);
app.use("/api/requisitions", requisitionsRoutes);
app.use("/api/issue-vouchers", issueVouchersRoutes);
app.use("/api/fixed-assets", fixedAssetsRoutes);
app.use("/api/returns", returnsRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/disposal-requests", disposalRoutes);
app.use("/api/stock-control", stockControlRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use((req, res) =>
  res
    .status(404)
    .json({ error: `No route for ${req.method} ${req.originalUrl}` }),
);
app.use(errorHandler);

module.exports = app;
