require("dotenv").config();
const fs = require("fs");
const https = require("https");
const app = require("./app");
const { startShelfLifeMonitor } = require("./utils/shelfLifeMonitor");
const { pool } = require("./config/db");

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
const useProxyTls = process.env.TLS_TERMINATED_BY_PROXY === "true";

function startServer() {
  if (isProduction && !useProxyTls) {
    if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) {
      throw new Error(
        "Production HTTPS requires SSL_KEY_PATH and SSL_CERT_PATH, or TLS_TERMINATED_BY_PROXY=true.",
      );
    }
    const server = https.createServer(
      {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
      },
      app,
    );
    return server.listen(PORT, onListen);
  }
  return app.listen(PORT, onListen);
}

let server;
let shelfLifeTimer;

function onListen() {
  const scheme = isProduction ? "https" : "http";
  console.log(`SPMS backend listening on ${scheme}://localhost:${PORT}`);
  console.log(`Health check: ${scheme}://localhost:${PORT}/api/health`);
  shelfLifeTimer = startShelfLifeMonitor();
}

server = startServer();

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully.`);
  if (shelfLifeTimer) clearInterval(shelfLifeTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
