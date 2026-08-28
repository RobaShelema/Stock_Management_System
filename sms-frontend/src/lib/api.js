// Central API client for the SPMS backend (see sms-backend/README.md for the
// full route reference). Every response is deep-converted from the backend's
// snake_case column names to camelCase so page components can use a single
// consistent naming convention regardless of which SQL query produced a row.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "spms_token";

let authToken = null;

function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function loadToken() {
  authToken = localStorage.getItem(TOKEN_KEY);
  return authToken;
}

function toCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// Recursively converts every object key in `input` from snake_case to
// camelCase. Arrays and primitives pass through unchanged (besides recursing
// into array elements). Safe to run on already-camelCase data — a key with
// no underscore is returned unchanged.
function toCamel(input) {
  if (Array.isArray(input)) return input.map(toCamel);
  if (input !== null && typeof input === "object" && !(input instanceof Date)) {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      out[toCamelKey(key)] = toCamel(value);
    }
    return out;
  }
  return input;
}

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      `Could not reach the API at ${BASE_URL}. Is the backend running (npm run dev in sms-backend)?`,
      0,
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${res.status}`,
      res.status,
      data?.details,
    );
  }

  return toCamel(data);
}

async function download(path) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers });
  } catch {
    throw new ApiError(`Could not reach the API at ${BASE_URL}.`, 0);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      data?.error || `Request failed with status ${res.status}`,
      res.status,
    );
  }
  return {
    blob: await res.blob(),
    fileName: res.headers
      .get("content-disposition")
      ?.match(/filename="?([^";]+)"?/)?.[1],
  };
}

function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")
  );
}

const api = {
  ApiError,
  setToken,
  loadToken,
  baseUrl: BASE_URL,

  auth: {
    login: (email, password) =>
      request("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
  },

  users: {
    list: () => request("/users"),
    create: (data) => request("/users", { method: "POST", body: data }),
    update: (id, data) =>
      request(`/users/${id}`, { method: "PUT", body: data }),
    toggleStatus: (id) =>
      request(`/users/${id}/toggle-status`, { method: "POST" }),
  },

  stores: {
    list: () => request("/stores"),
    create: (data) => request("/stores", { method: "POST", body: data }),
    update: (id, data) =>
      request(`/stores/${id}`, { method: "PUT", body: data }),
    toggleStatus: (id) =>
      request(`/stores/${id}/toggle-status`, { method: "POST" }),
  },

  categories: {
    list: () => request("/categories"),
    create: (data) => request("/categories", { method: "POST", body: data }),
  },

  itemLocations: {
    list: () => request("/item-locations"),
    upsert: (data) =>
      request("/item-locations", { method: "POST", body: data }),
  },

  items: {
    list: () => request("/items"),
    create: (data) => request("/items", { method: "POST", body: data }),
  },

  suppliers: {
    list: () => request("/suppliers"),
    create: (data) => request("/suppliers", { method: "POST", body: data }),
    update: (id, data) =>
      request(`/suppliers/${id}`, { method: "PUT", body: data }),
    toggleStatus: (id) =>
      request(`/suppliers/${id}/toggle-status`, { method: "POST" }),
  },

  goodsReceipts: {
    list: () => request("/goods-receipts"),
    create: (data) =>
      request("/goods-receipts", { method: "POST", body: data }),
    evaluate: (id, data) =>
      request(`/goods-receipts/${id}/evaluate`, { method: "POST", body: data }),
    generateGrn: (id, data) =>
      request(`/goods-receipts/${id}/generate-grn`, {
        method: "POST",
        body: data || {},
      }),
  },

  stockCards: {
    get: (itemId) => request(`/stock-cards/${itemId}`),
  },

  binCards: {
    list: () => request("/bin-cards"),
    entries: (id) => request(`/bin-cards/${id}/entries`),
    transfer: (data) =>
      request("/bin-cards/transfer", { method: "POST", body: data }),
  },

  requisitions: {
    list: () => request("/requisitions"),
    create: (data) => request("/requisitions", { method: "POST", body: data }),
    decide: (id, decision, confirmationPassword) =>
      request(`/requisitions/${id}/decide`, {
        method: "POST",
        body: { decision, confirmationPassword },
      }),
  },

  issueVouchers: {
    list: () => request("/issue-vouchers"),
    createPreliminary: (requisitionId) =>
      request("/issue-vouchers/preliminary", {
        method: "POST",
        body: { requisitionId },
      }),
    amend: (id, qty) =>
      request(`/issue-vouchers/${id}/amend`, { method: "POST", body: { qty } }),
    approve: (id, decision, remarks, confirmationPassword) =>
      request(`/issue-vouchers/${id}/approve`, {
        method: "POST",
        body: { decision, remarks, confirmationPassword },
      }),
    finalize: (id, confirmationPassword) =>
      request(`/issue-vouchers/${id}/finalize`, {
        method: "POST",
        body: { confirmationPassword },
      }),
    recordGateClearance: (id, notes) =>
      request(`/issue-vouchers/${id}/gate-clearance`, {
        method: "POST",
        body: { notes },
      }),
  },

  fixedAssets: {
    list: () => request("/fixed-assets"),
    create: (data) => request("/fixed-assets", { method: "POST", body: data }),
    userCards: () => request("/fixed-assets/user-cards"),
    reassign: (id, data) =>
      request(`/fixed-assets/${id}/reassign`, { method: "POST", body: data }),
    verify: (id, data) =>
      request(`/fixed-assets/${id}/verify`, { method: "POST", body: data }),
    history: (id) => request(`/fixed-assets/${id}/history`),
  },

  returns: {
    list: () => request("/returns"),
    create: (data) => request("/returns", { method: "POST", body: data }),
    evaluate: (id, condition, remarks) =>
      request(`/returns/${id}/evaluate`, {
        method: "POST",
        body: { condition, remarks },
      }),
    decide: (id, decision, confirmationPassword) =>
      request(`/returns/${id}/decide`, {
        method: "POST",
        body: { decision, confirmationPassword },
      }),
  },

  transfers: {
    list: () => request("/transfers"),
    create: (data) => request("/transfers", { method: "POST", body: data }),
    decide: (id, decision, confirmationPassword) =>
      request(`/transfers/${id}/decide`, {
        method: "POST",
        body: { decision, confirmationPassword },
      }),
  },

  disposal: {
    list: () => request("/disposal-requests"),
    flag: (data) =>
      request("/disposal-requests", { method: "POST", body: data }),
    forward: (id, notes) =>
      request(`/disposal-requests/${id}/forward`, {
        method: "POST",
        body: { notes },
      }),
    decide: (id, decision, method, confirmationPassword) =>
      request(`/disposal-requests/${id}/decide`, {
        method: "POST",
        body: { decision, method, confirmationPassword },
      }),
    writeOff: (id, amount, notes) =>
      request(`/disposal-requests/${id}/write-off`, {
        method: "POST",
        body: { amount, notes },
      }),
  },

  stockControl: {
    alerts: () => request("/stock-control/alerts"),
    shelfLifeAlerts: () => request("/stock-control/shelf-life-alerts"),
    listStockTakes: () => request("/stock-control/stock-takes"),
    getStockTake: (id) => request(`/stock-control/stock-takes/${id}`),
    scheduleStockTake: (data) =>
      request("/stock-control/stock-takes", { method: "POST", body: data }),
    recordCount: (takeId, lineId, countedQty) =>
      request(`/stock-control/stock-takes/${takeId}/lines/${lineId}/count`, {
        method: "POST",
        body: { countedQty },
      }),
    reconcile: (takeId, findings, confirmationPassword) =>
      request(`/stock-control/stock-takes/${takeId}/reconcile`, {
        method: "POST",
        body: { findings, confirmationPassword },
      }),
    valuation: (itemId) => request(`/stock-control/valuation${qs({ itemId })}`),
  },

  reports: {
    generate: (type) => request(`/reports/${type}`),
    export: (type, format) => download(`/reports/${type}/${format}`),
  },

  auditLogs: {
    list: (params) => request(`/audit-logs${qs(params)}`),
  },

  system: {
    health: () => request("/system/health"),
    backup: () => request("/system/backup", { method: "POST" }),
    getSettings: () => request("/system/settings"),
    updateSettings: (data) =>
      request("/system/settings", { method: "PUT", body: data }),
  },

  notifications: {
    list: () => request("/notifications"),
    markRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () => request("/notifications/read-all", { method: "POST" }),
  },
};

export default api;
