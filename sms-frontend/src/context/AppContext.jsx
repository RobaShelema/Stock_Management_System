import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../lib/api.js";

const AppContext = createContext(null);

// One state slice + one fetch function per backend resource. Keeping this as
// a flat config makes `refreshAll()` and per-action refreshes mechanical
// instead of repetitive.
const RESOURCES = {
  stores: () => api.stores.list(),
  categories: () => api.categories.list(),
  itemLocations: () => api.itemLocations.list(),
  items: () => api.items.list(),
  suppliers: () => api.suppliers.list(),
  users: () => api.users.list(),
  goodsReceipts: () => api.goodsReceipts.list(),
  binCards: () => api.binCards.list(),
  requisitions: () => api.requisitions.list(),
  issueVouchers: () => api.issueVouchers.list(),
  fixedAssets: () => api.fixedAssets.list(),
  userCards: () => api.fixedAssets.userCards(),
  returns: () => api.returns.list(),
  transfers: () => api.transfers.list(),
  disposals: () => api.disposal.list(),
  auditLogs: () => api.auditLogs.list(),
  reorderAlerts: () => api.stockControl.alerts(),
  stockTakes: () => api.stockControl.listStockTakes(),
  notifications: () => api.notifications.list(),
};

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("sms-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sms-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dim" : "light"));
  }, []);

  const [data, setData] = useState(
    Object.fromEntries(Object.keys(RESOURCES).map((k) => [k, []])),
  );

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3800);
  }, []);

  // ---- generic refresh machinery -------------------------------------
  const refresh = useCallback(
    async (key) => {
      const fetcher = RESOURCES[key];
      if (!fetcher) return;
      try {
        const rows = await fetcher();
        setData((prev) => ({ ...prev, [key]: rows }));
      } catch (err) {
        showToast(err.message, "warn");
      }
    },
    [showToast],
  );

  const refreshMany = useCallback(
    async (keys) => {
      await Promise.all(keys.map((k) => refresh(k)));
    },
    [refresh],
  );

  const refreshAll = useCallback(async () => {
    setDataLoading(true);
    try {
      await Promise.all(Object.keys(RESOURCES).map((k) => refresh(k)));
    } finally {
      setDataLoading(false);
    }
  }, [refresh]);

  // Runs a mutating API call, shows a toast either way, refreshes the given
  // resource keys on success, and returns { ok, result|error } so callers
  // can decide whether to close a modal / reset a form.
  const runAction = useCallback(
    async (fn, { successMessage, refreshKeys = [] }) => {
      try {
        const result = await fn();
        if (refreshKeys.length > 0) await refreshMany(refreshKeys);
        if (successMessage) showToast(successMessage);
        return { ok: true, result };
      } catch (err) {
        showToast(err.message, "warn");
        return { ok: false, error: err };
      }
    },
    [refreshMany, showToast],
  );

  // ---- auth -------------------------------------------------------------
  useEffect(() => {
    const token = api.loadToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api.auth
      .me()
      .then(async ({ user }) => {
        setCurrentUser(user);
        await refreshAll();
      })
      .catch(() => {
        api.setToken(null);
        setCurrentUser(null);
      })
      .finally(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user } = await api.auth.login(email, password);
      api.setToken(token);
      setCurrentUser(user);
      await refreshAll();
      return user;
    },
    [refreshAll],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Best-effort — proceed with local logout regardless.
    }
    api.setToken(null);
    setCurrentUser(null);
    setData(Object.fromEntries(Object.keys(RESOURCES).map((k) => [k, []])));
  }, []);

  // ---- lookups ------------------------------------------------------
  const itemById = useCallback(
    (id) => data.items.find((i) => i.id === id),
    [data.items],
  );
  const storeById = useCallback(
    (id) => data.stores.find((s) => s.id === id),
    [data.stores],
  );
  const supplierById = useCallback(
    (id) => data.suppliers.find((s) => s.id === id),
    [data.suppliers],
  );
  const categoryById = useCallback(
    (id) => data.categories.find((c) => c.id === id),
    [data.categories],
  );

  // ---- Goods receipt workflow ----
  const addGoodsReceipt = (payload) =>
    runAction(() => api.goodsReceipts.create(payload), {
      successMessage: "Goods receipt recorded and sent to TEC.",
      refreshKeys: ["goodsReceipts", "auditLogs"],
    });

  const evaluateGoodsReceipt = (id, decision, remarks) =>
    runAction(() => api.goodsReceipts.evaluate(id, { decision, remarks }), {
      successMessage: `Evaluation recorded: ${decision}.`,
      refreshKeys: ["goodsReceipts", "auditLogs"],
    });

  const generateGRN = (id, unitCost, bin) =>
    runAction(
      () =>
        api.goodsReceipts.generateGrn(
          id,
          unitCost !== undefined || bin !== undefined
            ? { unitCost, bin }
            : undefined,
        ),
      {
        successMessage: "GRN generated and stock updated.",
        refreshKeys: [
          "goodsReceipts",
          "items",
          "binCards",
          "itemLocations",
          "reorderAlerts",
          "auditLogs",
        ],
      },
    );

  // ---- Requisition / Issuing workflow ----
  const addRequisition = (payload) =>
    runAction(() => api.requisitions.create(payload), {
      successMessage: "Requisition submitted for approval.",
      refreshKeys: ["requisitions", "auditLogs"],
    });

  const decideRequisition = (id, decision) =>
    runAction(
      () => {
        if (currentUser?.role === "Department Head") {
          return api.requisitions.decide(id, decision);
        }
        const confirmationPassword = window.prompt(
          "Confirm this decision with your password:",
        );
        return confirmationPassword
          ? api.requisitions.decide(id, decision, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: `Requisition ${decision.toLowerCase()}.`,
        refreshKeys: ["requisitions", "auditLogs"],
      },
    );

  const createPreliminaryVoucher = (requisitionId) =>
    runAction(() => api.issueVouchers.createPreliminary(requisitionId), {
      successMessage: "Preliminary voucher (Model 20) created.",
      refreshKeys: ["issueVouchers", "auditLogs"],
    });

  const amendVoucher = (id, qty) =>
    runAction(() => api.issueVouchers.amend(id, qty), {
      successMessage: "Voucher quantity amended.",
      refreshKeys: ["issueVouchers", "auditLogs"],
    });

  const approveVoucher = (id, decision, remarks) =>
    runAction(
      () => {
        const confirmationPassword = window.prompt(
          "Confirm this voucher decision with your password:",
        );
        return confirmationPassword
          ? api.issueVouchers.approve(
              id,
              decision,
              remarks,
              confirmationPassword,
            )
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: `Voucher ${decision.toLowerCase()}.`,
        refreshKeys: ["issueVouchers", "auditLogs"],
      },
    );

  const finalizeVoucher = (id) =>
    runAction(
      () => {
        const confirmationPassword = window.prompt(
          "Confirm final Model 22 issue with your password:",
        );
        return confirmationPassword
          ? api.issueVouchers.finalize(id, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: "Voucher issued (Model 22). Stock updated.",
        refreshKeys: [
          "issueVouchers",
          "requisitions",
          "items",
          "binCards",
          "reorderAlerts",
          "auditLogs",
        ],
      },
    );

  const recordGateClearance = (id, notes) =>
    runAction(() => api.issueVouchers.recordGateClearance(id, notes), {
      successMessage: "Gate clearance recorded.",
      refreshKeys: ["issueVouchers", "auditLogs"],
    });

  // ---- Returns ----
  const addReturn = (payload) =>
    runAction(() => api.returns.create(payload), {
      successMessage: "Return submitted for technical evaluation.",
      refreshKeys: ["returns", "auditLogs"],
    });

  const evaluateReturn = (id, condition, remarks) =>
    runAction(() => api.returns.evaluate(id, condition, remarks), {
      successMessage: `Return condition recorded: ${condition}.`,
      refreshKeys: ["returns", "auditLogs"],
    });

  const decideReturn = (id, decision) =>
    runAction(
      () => {
        if (currentUser?.role === "Department Head") {
          return api.returns.decide(id, decision);
        }
        const confirmationPassword = window.prompt(
          "Confirm this return decision with your password:",
        );
        return confirmationPassword
          ? api.returns.decide(id, decision, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: `Return ${decision.toLowerCase()}.`,
        refreshKeys: ["returns", "items", "binCards", "disposals", "auditLogs"],
      },
    );

  // ---- Transfers ----
  const addTransfer = (payload) =>
    runAction(() => api.transfers.create(payload), {
      successMessage: "Transfer submitted for approval.",
      refreshKeys: ["transfers", "auditLogs"],
    });

  const decideTransfer = (id, decision) =>
    runAction(
      () => {
        const confirmationPassword = window.prompt(
          "Confirm this transfer decision with your password:",
        );
        return confirmationPassword
          ? api.transfers.decide(id, decision, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: `Transfer ${decision.toLowerCase()}.`,
        refreshKeys: ["transfers", "binCards", "itemLocations", "auditLogs"],
      },
    );

  // ---- Disposal ----
  const flagForDisposal = (payload) =>
    runAction(() => api.disposal.flag(payload), {
      successMessage: "Item flagged for disposal.",
      refreshKeys: ["disposals", "auditLogs"],
    });

  const forwardDisposal = (id, notes) =>
    runAction(() => api.disposal.forward(id, notes), {
      successMessage:
        "Disposal request reviewed and forwarded to the Disposal Committee.",
      refreshKeys: ["disposals", "auditLogs"],
    });

  const decideDisposal = (id, decision, method) =>
    runAction(
      () => {
        const confirmationPassword = window.prompt(
          "Confirm this disposal decision with your password:",
        );
        return confirmationPassword
          ? api.disposal.decide(id, decision, method, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: `Disposal request ${decision.toLowerCase()}.`,
        refreshKeys: ["disposals", "items", "reorderAlerts", "auditLogs"],
      },
    );

  const recordFinancialWriteOff = (id, amount, notes) =>
    runAction(() => api.disposal.writeOff(id, amount, notes), {
      successMessage: "Financial write-off recorded.",
      refreshKeys: ["disposals", "auditLogs"],
    });

  // ---- Bin transfer ----
  const transferBetweenBins = (payload) =>
    runAction(() => api.binCards.transfer(payload), {
      successMessage: "Stock transferred between bins.",
      refreshKeys: ["binCards", "itemLocations", "auditLogs"],
    });

  // ---- Stock control: stock takes, reconciliation, valuation ----
  const scheduleStockTake = (payload) =>
    runAction(() => api.stockControl.scheduleStockTake(payload), {
      successMessage: "Physical stock take scheduled.",
      refreshKeys: ["stockTakes", "auditLogs"],
    });

  const recordStockTakeCount = (takeId, lineId, countedQty) =>
    runAction(() => api.stockControl.recordCount(takeId, lineId, countedQty), {
      successMessage: "Count recorded.",
      refreshKeys: [],
    });

  const reconcileStockTake = (takeId, findings) =>
    runAction(
      () => {
        const confirmationPassword = window.prompt(
          "Confirm this stock reconciliation with your password:",
        );
        return confirmationPassword
          ? api.stockControl.reconcile(takeId, findings, confirmationPassword)
          : Promise.reject(new Error("Confirmation cancelled."));
      },
      {
        successMessage: "Stock take reconciled.",
        refreshKeys: ["stockTakes", "items", "auditLogs"],
      },
    );

  // ---- generic setup CRUD (stores, categories, item locations, items, suppliers, users) ----
  const addStore = (payload) =>
    runAction(() => api.stores.create(payload), {
      successMessage: "Store registered.",
      refreshKeys: ["stores", "auditLogs"],
    });
  const updateStore = (id, payload) =>
    runAction(() => api.stores.update(id, payload), {
      successMessage: "Store configuration updated.",
      refreshKeys: ["stores", "auditLogs"],
    });
  const toggleStoreStatus = (id) =>
    runAction(() => api.stores.toggleStatus(id), {
      successMessage: "Store status updated.",
      refreshKeys: ["stores", "auditLogs"],
    });

  const addCategory = (payload) =>
    runAction(() => api.categories.create(payload), {
      successMessage: "Category created.",
      refreshKeys: ["categories"],
    });

  const upsertItemLocation = (payload) =>
    runAction(() => api.itemLocations.upsert(payload), {
      successMessage: "Item location updated.",
      refreshKeys: ["itemLocations"],
    });

  const addItem = (payload) =>
    runAction(() => api.items.create(payload), {
      successMessage: "Item registered.",
      refreshKeys: ["items", "reorderAlerts"],
    });

  const addSupplier = (payload) =>
    runAction(() => api.suppliers.create(payload), {
      successMessage: "Supplier registered.",
      refreshKeys: ["suppliers", "auditLogs"],
    });
  const updateSupplier = (id, payload) =>
    runAction(() => api.suppliers.update(id, payload), {
      successMessage: "Supplier details updated.",
      refreshKeys: ["suppliers", "auditLogs"],
    });
  const toggleSupplierStatus = (id) =>
    runAction(() => api.suppliers.toggleStatus(id), {
      successMessage: "Supplier status updated.",
      refreshKeys: ["suppliers", "auditLogs"],
    });

  const addUser = (payload) =>
    runAction(() => api.users.create(payload), {
      successMessage: "User registered.",
      refreshKeys: ["users", "auditLogs"],
    });
  const updateUser = (id, payload) =>
    runAction(() => api.users.update(id, payload), {
      successMessage: "User account and role updated.",
      refreshKeys: ["users", "auditLogs"],
    });
  const toggleUserStatus = (id) =>
    runAction(() => api.users.toggleStatus(id), {
      successMessage: "User status updated.",
      refreshKeys: ["users", "auditLogs"],
    });

  // ---- System Administration ----
  const triggerBackup = () =>
    runAction(() => api.system.backup(), {
      successMessage: "Data backup generated and recorded in audit log.",
      refreshKeys: ["auditLogs"],
    });

  const getSystemHealth = () => api.system.health();
  const getSystemSettings = () => api.system.getSettings();
  const updateSystemSettings = (payload) =>
    runAction(() => api.system.updateSettings(payload), {
      successMessage: "System-wide settings updated.",
      refreshKeys: ["auditLogs"],
    });

  const markNotificationRead = (id) =>
    runAction(() => api.notifications.markRead(id), {
      refreshKeys: ["notifications"],
    });
  const markAllNotificationsRead = () =>
    runAction(() => api.notifications.markAllRead(), {
      refreshKeys: ["notifications"],
    });

  // ---- Fixed assets ----
  const addFixedAsset = (payload) =>
    runAction(() => api.fixedAssets.create(payload), {
      successMessage: "Fixed asset registered.",
      refreshKeys: ["fixedAssets", "userCards"],
    });

  const reassignFixedAsset = (id, payload) =>
    runAction(() => api.fixedAssets.reassign(id, payload), {
      successMessage: "Fixed asset custody reassigned.",
      refreshKeys: ["fixedAssets", "userCards", "auditLogs"],
    });

  const verifyFixedAsset = (id, payload) =>
    runAction(() => api.fixedAssets.verify(id, payload), {
      successMessage: "Fixed asset verification recorded.",
      refreshKeys: ["fixedAssets", "auditLogs"],
    });

  const value = useMemo(
    () => ({
      // auth
      currentUser,
      authChecked,
      dataLoading,
      theme,
      toggleTheme,
      login,
      logout,
      // data
      ...data,
      refresh,
      refreshAll,
      // lookups
      itemById,
      storeById,
      supplierById,
      categoryById,
      // toast
      toast,
      showToast,
      // actions
      addGoodsReceipt,
      evaluateGoodsReceipt,
      generateGRN,
      addRequisition,
      decideRequisition,
      createPreliminaryVoucher,
      amendVoucher,
      approveVoucher,
      recordGateClearance,
      finalizeVoucher,
      addReturn,
      evaluateReturn,
      decideReturn,
      addTransfer,
      decideTransfer,
      flagForDisposal,
      forwardDisposal,
      decideDisposal,
      recordFinancialWriteOff,
      transferBetweenBins,

      scheduleStockTake,
      recordStockTakeCount,
      reconcileStockTake,
      addStore,
      updateStore,
      toggleStoreStatus,
      addCategory,
      upsertItemLocation,
      addItem,
      addSupplier,
      updateSupplier,
      toggleSupplierStatus,
      addUser,
      updateUser,
      toggleUserStatus,
      triggerBackup,
      getSystemHealth,
      getSystemSettings,
      updateSystemSettings,
      markNotificationRead,
      markAllNotificationsRead,
      addFixedAsset,
      reassignFixedAsset,
      verifyFixedAsset,
    }),

    // Intentionally broad — this context re-renders on any data change by
    // design, and every consumer already re-renders together via useApp().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, authChecked, dataLoading, data, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
