import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Stores from "./pages/stores/Stores.jsx";
import Categories from "./pages/stores/Categories.jsx";
import ItemLocations from "./pages/stores/ItemLocations.jsx";
import ItemsPage from "./pages/items/Items.jsx";
import Suppliers from "./pages/suppliers/Suppliers.jsx";
import GoodsReceipt from "./pages/receipt/GoodsReceipt.jsx";
import StockCards from "./pages/cards/StockCards.jsx";
import BinCards from "./pages/cards/BinCards.jsx";
import Requisitions from "./pages/requisition/Requisitions.jsx";
import IssueVouchers from "./pages/requisition/IssueVouchers.jsx";
import FixedAssets from "./pages/assets/FixedAssets.jsx";
import Returns from "./pages/returns/Returns.jsx";
import Transfers from "./pages/transfers/Transfers.jsx";
import Disposal from "./pages/disposal/Disposal.jsx";
import StockControl from "./pages/stockControl/StockControl.jsx";
import Reports from "./pages/reports/Reports.jsx";
import AuditLog from "./pages/audit/AuditLog.jsx";
import Users from "./pages/users/Users.jsx";
import SystemSettings from "./pages/system/SystemSettings.jsx";
import SystemHealth from "./pages/system/SystemHealth.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/locations" element={<ItemLocations />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/goods-receipt" element={<GoodsReceipt />} />
        <Route path="/stock-cards" element={<StockCards />} />
        <Route path="/bin-cards" element={<BinCards />} />
        <Route path="/requisitions" element={<Requisitions />} />
        <Route path="/issue-vouchers" element={<IssueVouchers />} />
        <Route path="/fixed-assets" element={<FixedAssets />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/disposal" element={<Disposal />} />
        <Route path="/stock-control" element={<StockControl />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/users" element={<Users />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/system-health" element={<SystemHealth />} />
      </Route>
    </Routes>
  );
}

