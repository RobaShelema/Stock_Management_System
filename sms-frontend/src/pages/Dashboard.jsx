import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  PackageCheck,
  ClipboardList,
  AlertTriangle,
  Recycle,
  TrendingDown,
  Users,
  Warehouse,
  Truck,
  ShieldCheck,
  Activity,
  HardDriveDownload,
  Settings,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  Undo2,
  ArrowLeftRight,
  Scale,
  BarChart3,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Plus,
  MapPin,
  Package,
  ArrowRightCircle,
  Send,
  Search,
  FileCheck,
  DollarSign,
  GanttChartSquare,
  Tags,
  UserCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  PageHeader,
  StatCard,
  Button,
  Field,
  inputCls,
} from "../components/ui/PageHeader.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import ActorHero from "../components/dashboard/ActorHero.jsx";
import WorkflowLifecycleBar from "../components/dashboard/WorkflowLifecycleBar.jsx";
import DashboardRoleHeader from "../components/dashboard/DashboardRoleHeader.jsx";
import TemplateMetricCard from "../components/dashboard/TemplateMetricCard.jsx";
import AreaLineChart from "../components/dashboard/AreaLineChart.jsx";
import DonutChart from "../components/dashboard/DonutChart.jsx";
import GroupedBarChart from "../components/dashboard/GroupedBarChart.jsx";
import RecentListCard from "../components/dashboard/RecentListCard.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Dashboard() {
  const {
    currentUser,
    users,
    stores,
    suppliers,
    items,
    goodsReceipts,
    requisitions,
    issueVouchers,
    returns,
    transfers,
    disposals,
    fixedAssets,
    userCards,
    binCards,
    stockTakes,
    auditLogs,
    reorderAlerts,
    storeById,
    addRequisition,
    decideRequisition,
    createPreliminaryVoucher,
    approveVoucher,
    finalizeVoucher,
    evaluateGoodsReceipt,
    addReturn,
    evaluateReturn,
    decideReturn,
    addTransfer,
    decideTransfer,
    forwardDisposal,
    decideDisposal,
    recordGateClearance,
    generateGRN,
    dataLoading,
  } = useApp();

  const isAdmin = currentUser?.role === "Administrator";
  const isPAO = currentUser?.role === "Property Administration Officer";
  const isStoreHead = currentUser?.role === "Store Head";
  const isStockClerk = currentUser?.role === "Stock Clerk";
  const isTEC = currentUser?.role === "Technical Evaluation Committee";
  const isPRO = currentUser?.role === "Property Registration Officer";
  const isDeptHead = currentUser?.role === "Department Head";
  const isAccountant = currentUser?.role === "Accountant";
  const isDisposalCommittee = currentUser?.role === "Disposal Committee";
  const isSecurity = currentUser?.role === "Campus Security Officer";

  // Shared operational metrics
  const pendingReceipts = goodsReceipts.filter(
    (g) => g.status === "Awaiting Evaluation",
  );
  const approvedReceipts = goodsReceipts.filter((g) => g.status === "Approved");
  const pendingRequisitions = requisitions.filter(
    (r) =>
      r.status === "Pending PAO Approval" || r.status === "Pending Approval",
  );
  const approvedRequisitions = requisitions.filter(
    (r) => r.status === "Approved",
  );
  const preliminaryVouchers = issueVouchers.filter(
    (v) => v.status === "Preliminary",
  );
  const approvedVouchers = issueVouchers.filter((v) => v.status === "Approved");
  const pendingReturnsEvaluation = returns.filter(
    (rt) => rt.status === "Pending Technical Evaluation",
  );
  const evaluatedReturns = returns.filter((rt) => rt.status === "Evaluated");
  const pendingTransfers = transfers.filter(
    (t) => t.status === "Pending Approval",
  );
  const pendingDisposals = disposals.filter(
    (d) => d.status === "Pending Disposal",
  );

  // TEC modals state
  const [evalReceiptTarget, setEvalReceiptTarget] = useState(null);
  const [receiptRemarks, setReceiptRemarks] = useState("");
  const [evalReturnTarget, setEvalReturnTarget] = useState(null);
  const [returnCondition, setReturnCondition] = useState("Serviceable");
  const [returnRemarks, setReturnRemarks] = useState("");

  // Disposal Committee decision state
  const [decideDisposalTarget, setDecideDisposalTarget] = useState(null);
  const [disposalMethod, setDisposalMethod] = useState("Auction");
  const [savingDisposal, setSavingDisposal] = useState(false);

  // Department Head quick modal states
  const [deptReqOpen, setDeptReqOpen] = useState(false);
  const [deptReqSaving, setDeptReqSaving] = useState(false);
  const [deptReqForm, setDeptReqForm] = useState({
    department: "",
    storeId: "",
    itemId: "",
    qty: 1,
  });

  const [deptReturnOpen, setDeptReturnOpen] = useState(false);
  const [deptReturnSaving, setDeptReturnSaving] = useState(false);
  const [deptReturnForm, setDeptReturnForm] = useState({
    itemId: "",
    sourceIssueVoucherId: "",
    qty: 1,
    reason: "",
  });

  const [deptTransferOpen, setDeptTransferOpen] = useState(false);
  const [deptTransferSaving, setDeptTransferSaving] = useState(false);
  const [deptTransferForm, setDeptTransferForm] = useState({
    itemId: "",
    qty: 1,
    fromStoreId: "",
    toStoreId: "",
  });

  const totalSeniorApprovals =
    pendingRequisitions.length +
    preliminaryVouchers.length +
    evaluatedReturns.length +
    pendingTransfers.length +
    pendingDisposals.length;

  const totalStockValue = items.reduce(
    (sum, i) => sum + Number(i.qtyOnHand) * Number(i.defaultUnitCost),
    0,
  );

  const activeFixedAssets = fixedAssets.filter(
    (f) => f.status === "In Use" || !f.status,
  );

  // Store Head / Clerk metrics & assigned store resolution
  const assignedStore =
    stores.find((s) => s.headUserId === currentUser?.id) ||
    stores.find((s) => s.headName === currentUser?.name) ||
    stores[0];

  const storeReceipts = assignedStore
    ? goodsReceipts.filter((g) => g.storeId === assignedStore.id)
    : goodsReceipts;

  const storeApprovedReqs = assignedStore
    ? approvedRequisitions.filter((r) => r.storeId === assignedStore.id)
    : approvedRequisitions;

  const storePrelimVouchers = assignedStore
    ? approvedVouchers.filter((v) => v.storeId === assignedStore.id)
    : approvedVouchers;

  const storeBins = assignedStore
    ? binCards.filter((b) => b.storeId === assignedStore.id)
    : binCards;

  const storeTakesPending = stockTakes.filter(
    (st) =>
      (!assignedStore || st.storeId === assignedStore.id) &&
      st.status === "Scheduled",
  );

  // Admin metrics
  const activeUsers = users.filter((u) => u.status === "Active" || !u.status);
  const inactiveUsers = users.filter((u) => u.status === "Inactive");
  const activeStores = stores.filter((s) => s.status === "Active" || !s.status);
  const activeSuppliers = suppliers.filter(
    (s) => s.status === "Active" || !s.status,
  );

  async function handleEvalReceipt(decision) {
    if (!evalReceiptTarget) return;
    await evaluateGoodsReceipt(evalReceiptTarget.id, decision, receiptRemarks);
    setEvalReceiptTarget(null);
    setReceiptRemarks("");
  }

  async function handleEvalReturn() {
    if (!evalReturnTarget) return;
    await evaluateReturn(evalReturnTarget.id, returnCondition, returnRemarks);
    setEvalReturnTarget(null);
    setReturnRemarks("");
  }

  async function handleDisposalDecision(decision) {
    if (!decideDisposalTarget) return;
    setSavingDisposal(true);
    await decideDisposal(
      decideDisposalTarget.id,
      decision,
      decision === "Approved" ? disposalMethod : undefined,
    );
    setSavingDisposal(false);
    setDecideDisposalTarget(null);
  }

  async function handleDeptReqSubmit(e) {
    e.preventDefault();
    setDeptReqSaving(true);
    const { ok } = await addRequisition({
      ...deptReqForm,
      department:
        deptReqForm.department ||
        currentUser?.department ||
        "Engineering College",
      qty: Number(deptReqForm.qty),
    });
    setDeptReqSaving(false);
    if (ok) {
      setDeptReqForm({ department: "", storeId: "", itemId: "", qty: 1 });
      setDeptReqOpen(false);
    }
  }

  async function handleDeptReturnSubmit(e) {
    e.preventDefault();
    setDeptReturnSaving(true);
    const { ok } = await addReturn({
      ...deptReturnForm,
      qty: Number(deptReturnForm.qty),
    });
    setDeptReturnSaving(false);
    if (ok) {
      setDeptReturnForm({
        itemId: "",
        sourceIssueVoucherId: "",
        qty: 1,
        reason: "",
      });
      setDeptReturnOpen(false);
    }
  }

  async function handleDeptTransferSubmit(e) {
    e.preventDefault();
    if (deptTransferForm.fromStoreId === deptTransferForm.toStoreId) return;
    setDeptTransferSaving(true);
    const { ok } = await addTransfer({
      ...deptTransferForm,
      qty: Number(deptTransferForm.qty),
    });
    setDeptTransferSaving(false);
    if (ok) {
      setDeptTransferForm({
        itemId: "",
        qty: 1,
        fromStoreId: "",
        toStoreId: "",
      });
      setDeptTransferOpen(false);
    }
  }

  // -------------------------------------------------------------
  // 1. SYSTEM ADMINISTRATOR DASHBOARD
  // -------------------------------------------------------------
  if (isAdmin) {
    const recentAuditItems = auditLogs.length > 0
      ? auditLogs.slice(0, 5).map((log, i) => ({
          id: log.id || i,
          title: log.action || "System event logged",
          subtitle: `${log.userName || "Admin"} • ${log.module || "System"}`,
          time: formatDate(log.createdAt),
          icon: ShieldCheck,
          iconBg: "bg-purple-100 text-purple-700",
        }))
      : [
          { id: 1, title: "New user added", subtitle: "Abel Tesfaye • Users", time: "2 mins ago", icon: UserPlus, iconBg: "bg-purple-100 text-purple-700" },
          { id: 2, title: "GRN-2026-012 approved", subtitle: "Dawit Bekele • Goods Receipt", time: "15 mins ago", icon: PackageCheck, iconBg: "bg-blue-100 text-blue-700" },
          { id: 3, title: "Item category updated", subtitle: "Sara Getachew • Categories", time: "1 hour ago", icon: Tags, iconBg: "bg-emerald-100 text-emerald-700" },
          { id: 4, title: "Store 'Central Store' created", subtitle: "Super Administrator • Stores", time: "2 hours ago", icon: Warehouse, iconBg: "bg-amber-100 text-amber-700" },
          { id: 5, title: "System backup created", subtitle: "Automated Routine • System", time: "3 hours ago", icon: HardDriveDownload, iconBg: "bg-slate-100 text-slate-700" },
        ];

    return (
      <div className="animate-fade-in space-y-6">
        <DashboardRoleHeader
          title="Dashboard"
          subtitle="Overview of system activities"
          user={currentUser}
          roleTitle="Super Administrator"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/users">
                <Button variant="clay" className="text-xs">
                  <UserPlus size={14} /> Add User
                </Button>
              </Link>
              <Link to="/system-health">
                <Button variant="secondary" className="text-xs">
                  <Activity size={14} /> System Health
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TemplateMetricCard
            label="Total Users"
            value={users.length || 128}
            badge="+12 this month"
            badgeTone="green"
            icon={Users}
          />
          <TemplateMetricCard
            label="Total Stores"
            value={stores.length || 7}
            badge="Active stores"
            badgeTone="neutral"
            icon={Warehouse}
          />
          <TemplateMetricCard
            label="Total Items"
            value={items.length || 1456}
            badge="In inventory"
            badgeTone="purple"
            icon={Boxes}
          />
          <TemplateMetricCard
            label="Total Assets"
            value={fixedAssets.length || 342}
            badge="Registered assets"
            badgeTone="blue"
            icon={CreditCard}
          />
        </div>

        {/* 2-Column Analytics & Recent Activities Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AreaLineChart
              title="System Activity"
              color="#8b5cf6"
              fillColor="rgba(139, 92, 246, 0.12)"
              data={[35, 48, 42, 60, 52, 78, 65, 88, 72, 95]}
              labels={["May 10", "May 17", "May 24", "May 31", "Jun 7"]}
            />
          </div>
          <div className="lg:col-span-5">
            <RecentListCard
              title="Recent Activities"
              items={recentAuditItems}
              viewAllLink="/audit-log"
              viewAllText="View All"
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-3">
            System Administrator Quick Actions
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/users"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Manage Accounts
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Roles &amp; permissions
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/stores"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <Warehouse size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Configure Stores
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Campus store units
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/system-health"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <HardDriveDownload size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Trigger Backup
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Health &amp; data snapshots
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/system-settings"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-800">
                  <Settings size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    System Settings
                  </p>
                  <p className="text-[10px] text-slate-400">Global policies</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-navy-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Active User Accounts &amp; Institutional Role Allocations
                </h2>
              </div>
              <Link
                to="/users"
                className="text-xs font-medium text-navy-700 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {users.slice(0, 6).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {u.role}
                    </span>
                    <Badge
                      tone={
                        u.status === "Active" || !u.status ? "green" : "red"
                      }
                    >
                      {u.status || "Active"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-clay-600" />
                <h2 className="text-sm font-semibold text-slate-800">
                  System Audit Trail
                </h2>
              </div>
              <Link
                to="/audit-log"
                className="text-xs font-medium text-navy-700 hover:underline"
              >
                Full Log
              </Link>
            </div>

            <div className="space-y-3.5">
              {auditLogs.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No audit events recorded yet.
                </p>
              )}
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="text-xs border-l-2 border-clay-400 pl-3 py-0.5"
                >
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {log.userName} ({log.role || "User"}) ·{" "}
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PROPERTY ADMINISTRATION OFFICER (PAO) DASHBOARD
  // -----------------------------------------------  if (isPAO) {
    const awaitingGrnCount = goodsReceipts.filter((g) => g.status === "Approved").length;

    const myTasks = [
      { id: 1, title: "TEC Evaluation", subtitle: `${pendingReceipts.length || 10} deliveries awaiting review`, badge: `${pendingReceipts.length || 10}`, badgeTone: "amber", icon: FileCheck, iconBg: "bg-amber-100 text-amber-700" },
      { id: 2, title: "SIV / Voucher Approvals", subtitle: `${preliminaryVouchers.length || 12} preliminary vouchers`, badge: `${preliminaryVouchers.length || 12}`, badgeTone: "blue", icon: CheckSquare, iconBg: "bg-blue-100 text-blue-700" },
      { id: 3, title: "Update Stock Cards", subtitle: "Ledger balances synchronization", badge: "7", badgeTone: "purple", icon: Boxes, iconBg: "bg-purple-100 text-purple-700" },
      { id: 4, title: "Bin Card Updates", subtitle: "Shelf allocation verification", badge: "9", badgeTone: "green", icon: Warehouse, iconBg: "bg-emerald-100 text-emerald-700" },
    ];

    return (
      <div className="animate-fade-in space-y-6">
        <DashboardRoleHeader
          title="Dashboard"
          subtitle="Welcome back, Property Officer"
          user={currentUser}
          roleTitle="Property Officer"
          department="Property Administration"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/reports">
                <Button variant="secondary" className="text-xs">
                  <FileSpreadsheet size={14} /> Reports
                </Button>
              </Link>
              <Link to="/stock-control">
                <Button variant="clay" className="text-xs">
                  <Scale size={14} /> Stock Takes
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TemplateMetricCard
            label="Pending TEC Evaluations"
            value={pendingReceipts.length || 18}
            badge="Items to evaluate"
            badgeTone="amber"
            icon={ClipboardList}
          />
          <TemplateMetricCard
            label="Pending GRN"
            value={awaitingGrnCount || 12}
            badge="Awaiting GRN"
            badgeTone="blue"
            icon={PackageCheck}
          />
          <TemplateMetricCard
            label="Active Items"
            value={items.length || 1456}
            badge="In stock"
            badgeTone="green"
            icon={Boxes}
          />
          <TemplateMetricCard
            label="Low Stock Items"
            value={reorderAlerts.length || 34}
            badge="Reorder soon"
            badgeTone="red"
            icon={AlertTriangle}
          />
        </div>

        {/* 2-Column Analytics & Tasks Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <GroupedBarChart
              title="Goods Receipt Overview"
              categories={["May 10", "May 17", "May 24", "May 31", "Jun 7"]}
              series={[
                { name: "Received", color: "#93c5fd", data: [12, 18, 14, 16, 20] },
                { name: "Accepted", color: "#2563eb", data: [10, 16, 12, 15, 19] },
              ]}
            />
          </div>
          <div className="lg:col-span-5">
            <RecentListCard
              title="My Tasks"
              items={myTasks}
              viewAllLink="/requisitions"
              viewAllText="Review All"
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-clay-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  PAO Senior Approval &amp; Decision Queue
                </h2>
                <p className="text-xs text-slate-400">
                  Direct senior approval gate for requisitions, voucher
                  issuances, returns, transfers, and disposal.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-700 ring-1 ring-clay-200">
              {totalSeniorApprovals} Pending Actions
            </span>
          </div>

          {totalSeniorApprovals === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                All senior approval queues are clear.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No requisitions, vouchers, returns, or transfers awaiting
                decision.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequisitions.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-navy-700" />
                      Store Requisitions Awaiting Senior Approval (
                      {pendingRequisitions.length})
                    </p>
                    <Link
                      to="/requisitions"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingRequisitions.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {r.refNo}
                          </span>{" "}
                          — {r.department} requested{" "}
                          <strong>
                            {r.qty}x {r.itemName}
                          </strong>{" "}
                          from {r.storeName}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideRequisition(r.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideRequisition(r.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preliminaryVouchers.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-clay-600" />
                      Preliminary Issue Vouchers (Model 20) Awaiting Approval (
                      {preliminaryVouchers.length})
                    </p>
                    <Link
                      to="/issue-vouchers"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View / Amend
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {preliminaryVouchers.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {v.refNo}
                          </span>{" "}
                          — {v.qty}x {v.itemName} (Store: {v.storeName})
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/issue-vouchers"
                            className="font-medium text-navy-700 hover:underline px-2 py-1 bg-slate-100 rounded"
                          >
                            Review / Amend
                          </Link>
                          <button
                            onClick={() => approveVoucher(v.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve Model 20
                          </button>
                          <button
                            onClick={() => approveVoucher(v.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evaluatedReturns.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Undo2 size={14} className="text-amber-600" />
                      Evaluated Material Returns (SRN) Awaiting PAO Decision (
                      {evaluatedReturns.length})
                    </p>
                    <Link
                      to="/returns"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {evaluatedReturns.slice(0, 3).map((rt) => (
                      <div
                        key={rt.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {rt.refNo}
                          </span>{" "}
                          — {rt.qty}x {rt.itemName} (Condition:{" "}
                          <strong className="text-navy-900">
                            {rt.condition}
                          </strong>
                          )
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideReturn(rt.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideReturn(rt.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingTransfers.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ArrowLeftRight size={14} className="text-indigo-600" />
                      Inter-Store Material Transfers Awaiting Approval (
                      {pendingTransfers.length})
                    </p>
                    <Link
                      to="/transfers"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingTransfers.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {t.refNo}
                          </span>{" "}
                          — {t.qty}x {t.itemName} ({t.fromStoreName} →{" "}
                          {t.toStoreName})
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideTransfer(t.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2 py-1 bg-emerald-50 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decideTransfer(t.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2 py-1 bg-rose-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingDisposals.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Recycle size={14} className="text-rose-600" />
                      Disposal Requests Flagged for Review (
                      {pendingDisposals.length})
                    </p>
                    <Link
                      to="/disposal"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      Review &amp; Forward
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingDisposals.slice(0, 3).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {d.refNo}
                          </span>{" "}
                          — {d.qty}x {d.itemName} ({d.reason})
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/disposal"
                            className="font-semibold text-clay-700 hover:underline px-2 py-1 bg-clay-50 rounded"
                          >
                            Review &amp; Forward
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            to="/stock-cards"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <Boxes size={20} className="text-navy-800 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Stock Cards</p>
            <p className="text-[10px] text-slate-400">FIFO ledger</p>
          </Link>

          <Link
            to="/bin-cards"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <Warehouse size={20} className="text-clay-600 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Bin Cards</p>
            <p className="text-[10px] text-slate-400">All store bins</p>
          </Link>

          <Link
            to="/fixed-assets"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <CreditCard size={20} className="text-emerald-700 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Fixed Assets</p>
            <p className="text-[10px] text-slate-400">User cards</p>
          </Link>

          <Link
            to="/stock-control"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <Scale size={20} className="text-indigo-700 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Stock Takes</p>
            <p className="text-[10px] text-slate-400">Reconciliation</p>
          </Link>

          <Link
            to="/reports"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <BarChart3 size={20} className="text-amber-700 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Reports</p>
            <p className="text-[10px] text-slate-400">Valuation &amp; CSV</p>
          </Link>

          <Link
            to="/audit-log"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm hover:border-navy-300 hover:shadow transition-all"
          >
            <ShieldCheck size={20} className="text-rose-700 mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Audit Trail</p>
            <p className="text-[10px] text-slate-400">Governance</p>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                University Reorder &amp; Safety Stock Warnings
              </h2>
            </div>
            {reorderAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                All items are above their reorder level.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reorderAlerts.map((a) => (
                  <div
                    key={a.itemId}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">
                        {a.qtyOnHand} in stock
                      </p>
                      <Badge
                        tone={
                          a.alertLevel === "Safety Stock Breach"
                            ? "red"
                            : "amber"
                        }
                      >
                        {a.alertLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-navy-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent Institutional Activity
                </h2>
              </div>
              <Link
                to="/audit-log"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Full Log
              </Link>
            </div>
            <div className="space-y-3">
              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No activity recorded yet.
                </p>
              )}
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="text-xs border-l-2 border-clay-400 pl-2.5 py-0.5"
                >
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.userName} · {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. STORE HEAD DASHBOARD
  // -------------------------------------------------------------
  if (isStoreHead) {
    const storeRecentActivities = [
      { id: 1, title: "Requisition approved", subtitle: "REQ-2026-088 • Approved by PAO", time: "10 mins ago", icon: ClipboardList, iconBg: "bg-emerald-100 text-emerald-700" },
      { id: 2, title: "Issue voucher created", subtitle: "SIV-2026-042 • Model 20 draft", time: "25 mins ago", icon: CheckSquare, iconBg: "bg-blue-100 text-blue-700" },
      { id: 3, title: "Stock issued", subtitle: "VOUCH-2026-019 • Model 22 issued", time: "1 hour ago", icon: Boxes, iconBg: "bg-purple-100 text-purple-700" },
      { id: 4, title: "Item returned", subtitle: "SRN-2026-005 • Condition A classified", time: "2 hours ago", icon: Undo2, iconBg: "bg-amber-100 text-amber-700" },
      { id: 5, title: "Stock transferred", subtitle: "TRF-2026-003 • Main Store -> Eng Store", time: "3 hours ago", icon: ArrowLeftRight, iconBg: "bg-teal-100 text-teal-700" },
    ];

    return (
      <div className="animate-fade-in space-y-6">
        <DashboardRoleHeader
          title="Dashboard"
          subtitle="Welcome back, Store Head"
          user={currentUser}
          roleTitle="Store Head"
          department={assignedStore ? assignedStore.name : "Main Store"}
          actions={
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <Button variant="clay" className="text-xs">
                  <Plus size={14} /> Record Delivery
                </Button>
              </Link>
              <Link to="/bin-cards">
                <Button variant="secondary" className="text-xs">
                  <ArrowLeftRight size={14} /> Bin Transfer
                </Button>
              </Link>
            </div>
          }
        />

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TemplateMetricCard
            label="Pending Requisitions"
            value={pendingRequisitions.length || 24}
            badge="Requires approval"
            badgeTone="amber"
            icon={ClipboardList}
          />
          <TemplateMetricCard
            label="Pending Issue Vouchers"
            value={preliminaryVouchers.length || 16}
            badge="Requires approval"
            badgeTone="red"
            icon={CheckSquare}
          />
          <TemplateMetricCard
            label="Stock Items"
            value={items.length || 1285}
            badge="Available"
            badgeTone="green"
            icon={Boxes}
          />
          <TemplateMetricCard
            label="Low Stock Items"
            value={lowStockItems.length || 28}
            badge="Below minimum"
            badgeTone="red"
            icon={AlertTriangle}
          />
        </div>

        {/* 2-Column Analytics & Recent Activities Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <DonutChart
              title="Stock Summary"
              total={items.length || 1285}
              totalLabel="Total Items"
              segments={[
                { label: "Available", count: 1028, percentage: 79, color: "#10b981" },
                { label: "Issued", count: 157, percentage: 12, color: "#3b82f6" },
                { label: "Reserved", count: 68, percentage: 5, color: "#f59e0b" },
                { label: "Low Stock", count: 32, percentage: 4, color: "#ef4444" },
              ]}
            />
          </div>
          <div className="lg:col-span-5">
            <RecentListCard
              title="Recent Activities"
              items={storeRecentActivities}
              viewAllLink="/issue-vouchers"
              viewAllText="View All"
            />
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-navy-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Approved Requisitions Ready for Issue Voucher (Model 20)
                    Creation
                  </h2>
                  <p className="text-xs text-slate-400">
                    Requisitions approved by Department Head &amp; PAO ready to
                    be issued from this store.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-800 ring-1 ring-navy-200">
                {storeApprovedReqs.length} Ready
              </span>
            </div>

            {storeApprovedReqs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No approved requisitions currently waiting for SIV creation.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {storeApprovedReqs.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-900">
                          {req.refNo}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        Requested:{" "}
                        <strong>
                          {req.qty}x {req.itemName}
                        </strong>{" "}
                        by {req.requestedByName || "Staff"}
                      </p>
                    </div>
                    <button
                      onClick={() => createPreliminaryVoucher(req.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                    >
                      <ArrowRightCircle size={14} /> Create SIV (Model 20)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-clay-600" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Approved Issue Vouchers (Model 20) — Ready to Finalize &amp;
                    Deduct Stock (Model 22)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Final issuance executes FIFO stock reduction and
                    automatically logs bin card deductions.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-800 ring-1 ring-clay-200">
                {storePrelimVouchers.length} Ready to Issue
              </span>
            </div>

            {storePrelimVouchers.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No approved vouchers awaiting final issuance.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {storePrelimVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-clay-800">
                          {v.refNo}
                        </span>
                        <span className="text-slate-400">
                          Ref: {v.requisitionRef}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        Material:{" "}
                        <strong>
                          {v.qty}x {v.itemName}
                        </strong>{" "}
                        (Store: {v.storeName})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/issue-vouchers"
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => finalizeVoucher(v.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-all"
                      >
                        <PackageCheck size={14} /> Finalize &amp; Issue (Model
                        22)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Store Operations Quick Launch
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Link
              to="/goods-receipt"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <PackageCheck size={20} className="text-navy-800 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Goods Receipt</p>
              <p className="text-[10px] text-slate-400">Record delivery</p>
            </Link>

            <Link
              to="/locations"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <MapPin size={20} className="text-clay-600 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Item Locations</p>
              <p className="text-[10px] text-slate-400">Bins &amp; shelves</p>
            </Link>

            <Link
              to="/bin-cards"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <ArrowLeftRight size={20} className="text-indigo-700 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Bin Transfers</p>
              <p className="text-[10px] text-slate-400">Internal store</p>
            </Link>

            <Link
              to="/transfers"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <Truck size={20} className="text-emerald-700 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Store Transfer</p>
              <p className="text-[10px] text-slate-400">Inter-store</p>
            </Link>

            <Link
              to="/disposal"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <Recycle size={20} className="text-rose-600 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Flag Disposal</p>
              <p className="text-[10px] text-slate-400">Damaged/expired</p>
            </Link>

            <Link
              to="/stock-control"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center hover:bg-slate-100 hover:border-navy-200 transition-all"
            >
              <Scale size={20} className="text-amber-700 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Stock Take</p>
              <p className="text-[10px] text-slate-400">Record counts</p>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-navy-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent Deliveries to this Store ({storeReceipts.length})
                </h2>
              </div>
              <Link
                to="/goods-receipt"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                View All
              </Link>
            </div>
            {storeReceipts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No goods receipts logged for this store yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {storeReceipts.slice(0, 5).map((gr) => (
                  <div
                    key={gr.id}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        {gr.refNo}
                      </span>{" "}
                      — {gr.qty}x {gr.itemName} from {gr.supplierName}
                      <p className="text-[11px] text-slate-400">
                        PO: {gr.poReference} · {formatDate(gr.createdAt)}
                      </p>
                    </div>
                    <Badge>{gr.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                Critical Stock Warnings
              </h2>
            </div>
            {reorderAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                All materials are above reorder thresholds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reorderAlerts.slice(0, 5).map((a) => (
                  <div
                    key={a.itemId}
                    className="flex items-center justify-between text-xs border-b border-slate-50 pb-2"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-[10px] text-slate-400">{a.code}</p>
                    </div>
                    <Badge
                      tone={
                        a.alertLevel === "Safety Stock Breach" ? "red" : "amber"
                      }
                    >
                      {a.qtyOnHand} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. STORE CLERK / STOREKEEPER DASHBOARD
  // -------------------------------------------------------------
  if (isStockClerk) {
    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Stock Clerk"
          subtitle="Store Operations & Inventory Clerk — Day-to-day goods delivery logging, storage bin & shelf allocations, internal transfers, and physical stock count execution."
          badgeText="Inventory Operations"
          storeOrDept={assignedStore ? `${assignedStore.name}` : "Store Unit"}
          actions={
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <Button variant="clay">
                  <Plus size={15} /> Record Goods Receipt
                </Button>
              </Link>
              <Link to="/locations">
                <Button variant="secondary">
                  <MapPin size={15} /> Update Bin Location
                </Button>
              </Link>
            </div>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Goods Receipts Logged"
            value={goodsReceipts.length}
            sub={`${pendingReceipts.length} awaiting TEC review`}
            tone="navy"
            icon={PackageCheck}
            badge="Receiving"
          />
          <StatCard
            label="Active Store Bins"
            value={binCards.length}
            sub="Mapped storage locations"
            tone="clay"
            icon={MapPin}
            badge="Locations"
          />
          <StatCard
            label="Physical Stock Takes"
            value={stockTakes.filter((st) => st.status === "Scheduled").length}
            sub="Scheduled count operations"
            tone="emerald"
            icon={Scale}
            badge="Counts"
          />
          <StatCard
            label="Low Stock Alerts"
            value={reorderAlerts.length}
            sub="Safety stock / reorder breach"
            tone={reorderAlerts.length > 0 ? "rose" : "purple"}
            icon={AlertTriangle}
            badge={reorderAlerts.length > 0 ? "Breach" : "Normal"}
          />
        </div>

        {/* Storekeeper Assisting Operations Hub */}
        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-3">
            Storekeeper Day-to-Day Assisting Operations
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/goods-receipt"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Record Delivery
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Log incoming goods
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/locations"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Update Bin Locations
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Shelves &amp; slots
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/bin-cards"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-800">
                  <ArrowLeftRight size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Bin Transfer
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Move between bins
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/stock-control"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Scale size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Physical Stock Count
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Record take lines
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-navy-700" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Store Requisitions (View Only)
                </h2>
              </div>
              <Link
                to="/requisitions"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                View All
              </Link>
            </div>
            {requisitions.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 text-xs border-b border-slate-50 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {r.refNo}
                  </span>{" "}
                  — {r.qty}x {r.itemName} ({r.department})
                </div>
                <Badge>{r.status}</Badge>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                Low Stock Warnings
              </h2>
            </div>
            {reorderAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                All materials healthy.
              </p>
            ) : (
              <div className="space-y-2">
                {reorderAlerts.slice(0, 5).map((a) => (
                  <div
                    key={a.itemId}
                    className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{a.name}</p>
                      <p className="text-[10px] text-slate-400">{a.code}</p>
                    </div>
                    <Badge
                      tone={
                        a.alertLevel === "Safety Stock Breach" ? "red" : "amber"
                      }
                    >
                      {a.qtyOnHand}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. TECHNICAL EVALUATION COMMITTEE (TEC) DASHBOARD
  // -------------------------------------------------------------
  if (isTEC) {
    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Technical Evaluation Committee"
          subtitle="Technical Inspection & Evaluation Directorate — Multi-disciplinary inspection panel for incoming goods specifications, return condition grading, and disposal justifications."
          badgeText="Technical Authority"
          storeOrDept="TEC Panel"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/goods-receipt">
                <Button variant="clay">
                  <Search size={15} /> Inspect Deliveries
                </Button>
              </Link>
              <Link to="/returns">
                <Button variant="secondary">
                  <Undo2 size={15} /> Classify Returns
                </Button>
              </Link>
            </div>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending Receipts Inspection"
            value={pendingReceipts.length}
            sub="Awaiting technical inspection"
            tone={pendingReceipts.length > 0 ? "clay" : "emerald"}
            icon={PackageCheck}
            badge="Model 19 Stage"
          />
          <StatCard
            label="Pending Returns Inspection"
            value={pendingReturnsEvaluation.length}
            sub="Awaiting condition classification"
            tone={pendingReturnsEvaluation.length > 0 ? "navy" : "emerald"}
            icon={Undo2}
            badge="SRN Stage"
          />
          <StatCard
            label="Flagged for Disposal"
            value={pendingDisposals.length}
            sub="Requires technical justification"
            tone="rose"
            icon={Recycle}
            badge="Disposal"
          />
          <StatCard
            label="Inspections Completed"
            value={approvedReceipts.length + evaluatedReturns.length}
            sub="Total verified dossiers"
            tone="emerald"
            icon={CheckCircle2}
            badge="Verified"
          />
        </div>

        {/* TEC Live Inspection Queues */}
        <div className="mt-6 space-y-5">
          {/* 1. Goods Receipts Awaiting Inspection */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-navy-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Goods Receipts Awaiting Technical Inspection (
                    {pendingReceipts.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Inspect physical specifications against Purchase Order /
                    Donor agreement and record Approve/Reject with remarks.
                  </p>
                </div>
              </div>
              <Link
                to="/goods-receipt"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                View All
              </Link>
            </div>

            {pendingReceipts.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2
                  size={24}
                  className="mx-auto text-emerald-500 mb-1 opacity-80"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Receipts inspection queue is clean.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReceipts.map((gr) => (
                  <div
                    key={gr.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-900">
                          {gr.refNo}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          PO: {gr.poReference}
                        </span>
                        <span className="text-slate-400">
                          Store: {gr.storeName}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        Delivered:{" "}
                        <strong>
                          {gr.qty}x {gr.itemName}
                        </strong>{" "}
                        from <em>{gr.supplierName}</em>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEvalReceiptTarget(gr);
                        setReceiptRemarks("");
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                    >
                      <Search size={13} /> Inspect &amp; Evaluate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Store Returns Awaiting Condition Classification */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Undo2 size={18} className="text-clay-600" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Store Returns Awaiting Condition Classification (
                    {pendingReturnsEvaluation.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Inspect returned materials and classify technical status:
                    Serviceable (returns to stock), Damaged, or Obsolete.
                  </p>
                </div>
              </div>
              <Link
                to="/returns"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                View All
              </Link>
            </div>

            {pendingReturnsEvaluation.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2
                  size={24}
                  className="mx-auto text-emerald-500 mb-1 opacity-80"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Store returns evaluation queue is clean.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReturnsEvaluation.map((rt) => (
                  <div
                    key={rt.id}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-clay-800">
                          {rt.refNo}
                        </span>
                        <span className="text-slate-400">
                          Returned by: {rt.returnedByName || "Department"}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        Material:{" "}
                        <strong>
                          {rt.qty}x {rt.itemName}
                        </strong>{" "}
                        — Reason: <em>"{rt.reason}"</em>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEvalReturnTarget(rt);
                        setReturnCondition("Serviceable");
                        setReturnRemarks("");
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-clay-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-800 shadow-sm transition-all"
                    >
                      <Search size={13} /> Classify Condition
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Receipt Evaluation Modal */}
        <Modal
          open={!!evalReceiptTarget}
          onClose={() => setEvalReceiptTarget(null)}
          title={`TEC Receipt Inspection — ${evalReceiptTarget?.refNo || ""}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setEvalReceiptTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleEvalReceipt("Rejected")}
              >
                <XCircle size={14} /> Reject Delivery
              </Button>
              <Button onClick={() => handleEvalReceipt("Approved")}>
                <CheckCircle2 size={14} /> Approve for GRN
              </Button>
            </>
          }
        >
          {evalReceiptTarget && (
            <div>
              <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                <p>
                  Material: <strong>{evalReceiptTarget.itemName}</strong> (Qty:{" "}
                  {evalReceiptTarget.qty})
                </p>
                <p>
                  Supplier: <strong>{evalReceiptTarget.supplierName}</strong>
                </p>
                <p>
                  PO Reference: <strong>{evalReceiptTarget.poReference}</strong>
                </p>
                <p>
                  Store: <strong>{evalReceiptTarget.storeName}</strong>
                </p>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technical Inspection Remarks &amp; Compliance Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  value={receiptRemarks}
                  onChange={(e) => setReceiptRemarks(e.target.value)}
                  placeholder="Record verification against technical specs, serial checks, package condition..."
                />
              </div>
            </div>
          )}
        </Modal>

        {/* Return Condition Evaluation Modal */}
        <Modal
          open={!!evalReturnTarget}
          onClose={() => setEvalReturnTarget(null)}
          title={`TEC Return Inspection — ${evalReturnTarget?.refNo || ""}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setEvalReturnTarget(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleEvalReturn}>
                <CheckCircle2 size={14} /> Save Classification
              </Button>
            </>
          }
        >
          {evalReturnTarget && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
                <p>
                  Material: <strong>{evalReturnTarget.itemName}</strong> (Qty:{" "}
                  {evalReturnTarget.qty})
                </p>
                <p>
                  Return Reason: <em>"{evalReturnTarget.reason}"</em>
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Classified Physical Condition
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 p-2 text-xs font-medium"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                >
                  <option value="Serviceable">
                    Serviceable (Can be re-issued to other units)
                  </option>
                  <option value="Damaged">
                    Damaged (Requires repair or disposal routing)
                  </option>
                  <option value="Obsolete">
                    Obsolete (End-of-life / Unserviceable)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  TEC Technical Evaluation Remarks
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Note physical damage, test results, missing accessories..."
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. PROPERTY REGISTRATION OFFICER (PRO) DASHBOARD
  // -------------------------------------------------------------
  if (isPRO) {
    // Receipts TEC-approved but GRN not yet generated
    const awaitingGrn = goodsReceipts.filter((g) => g.status === "Approved");
    // Fixed assets missing custodian (empty custodianName)
    const unassignedAssets = fixedAssets.filter(
      (f) => !f.custodianName || f.custodianName.trim() === "",
    );
    const grnsGenerated = goodsReceipts.filter(
      (g) => g.status === "GRN Generated",
    );

    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Property Registration Officer"
          subtitle="Fixed Asset & Goods Registry Directorate — Official Goods Receiving Notes (Model 19) generation, fixed-asset tag registration, custodian allocation, and User-Card management."
          badgeText="Asset Registrar"
          storeOrDept="Property Registry"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/fixed-assets">
                <Button variant="clay">
                  <Plus size={15} /> Register Asset
                </Button>
              </Link>
              <Link to="/audit-log">
                <Button variant="secondary">
                  <ShieldCheck size={15} /> Audit Trail
                </Button>
              </Link>
            </div>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Awaiting GRN Generation"
            value={awaitingGrn.length}
            sub="TEC-approved receipts — Model 19 pending"
            tone={awaitingGrn.length > 0 ? "clay" : "emerald"}
            icon={FileCheck}
            badge="Model 19 Ready"
          />
          <StatCard
            label="GRNs Generated"
            value={grnsGenerated.length}
            sub="Official Model 19 documents issued"
            tone="navy"
            icon={PackageCheck}
            badge="Archived"
          />
          <StatCard
            label="Registered Fixed Assets"
            value={fixedAssets.length}
            sub={`${activeFixedAssets.length} currently in active use`}
            tone="emerald"
            icon={CreditCard}
            badge="In Use"
          />
          <StatCard
            label="Unassigned Assets"
            value={unassignedAssets.length}
            sub="Awaiting custodian assignment"
            tone={unassignedAssets.length > 0 ? "amber" : "purple"}
            icon={Users}
            badge={unassignedAssets.length > 0 ? "Pending Custodian" : "All Assigned"}
          />
        </div>

        {/* Worklist A: TEC-Approved Receipts Awaiting GRN */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-navy-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  TEC-Approved Goods Receipts — Generate Official GRN (Model 19)
                </h2>
                <p className="text-xs text-slate-400">
                  These receipts have been technically approved. Generate the
                  official Goods Receiving Note to credit stock.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-700 ring-1 ring-clay-200">
              {awaitingGrn.length} Pending
            </span>
          </div>

          {awaitingGrn.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                All approved receipts have been GRN'd.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No receipts are waiting for Model 19 generation.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {awaitingGrn.map((gr) => (
                <div
                  key={gr.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-900">
                        {gr.refNo}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        TEC Approved
                      </span>
                      <span className="text-slate-400">
                        Store: {gr.storeName}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-0.5">
                      Material:{" "}
                      <strong>
                        {gr.qty}x {gr.itemName}
                      </strong>{" "}
                      from <em>{gr.supplierName}</em>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      PO Ref: {gr.poReference} · Received:{" "}
                      {new Date(gr.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => generateGRN && generateGRN(gr.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                  >
                    <FileCheck size={14} /> Generate GRN (Model 19)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worklist B: Fixed Assets without Custodian */}
        {unassignedAssets.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Fixed Assets Without Custodian Assignment (
                    {unassignedAssets.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assign a custodian and department to complete the
                    fixed-asset registration.
                  </p>
                </div>
              </div>
              <Link
                to="/fixed-assets"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Manage Assets
              </Link>
            </div>
            <div className="divide-y divide-amber-100">
              {unassignedAssets.slice(0, 4).map((fa) => (
                <div
                  key={fa.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-slate-800">
                      {fa.tag}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {fa.itemName || "—"}
                    </span>
                  </div>
                  <Link
                    to="/fixed-assets"
                    className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition-colors"
                  >
                    Assign Custodian
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRO Quick Actions */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            PRO Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Link
              to="/goods-receipt"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    GRN Log
                  </p>
                  <p className="text-[10px] text-slate-400">All receipts</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/fixed-assets"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Fixed Assets
                  </p>
                  <p className="text-[10px] text-slate-400">Asset register</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/fixed-assets"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    User-Cards
                  </p>
                  <p className="text-[10px] text-slate-400">Custody records</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/audit-log"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Audit Trail
                  </p>
                  <p className="text-[10px] text-slate-400">Asset history</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PackageCheck size={16} className="text-navy-700" />
              <h2 className="text-sm font-semibold text-slate-800">
                Recently Generated GRNs
              </h2>
            </div>
            <Link
              to="/goods-receipt"
              className="text-xs font-semibold text-navy-700 hover:underline"
            >
              View All
            </Link>
          </div>
          {grnsGenerated.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No GRNs generated yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {grnsGenerated.slice(0, 5).map((gr) => (
                <div
                  key={gr.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      {gr.refNo}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {gr.qty}x {gr.itemName}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      GRN: {gr.grnNumber || "—"} · {gr.storeName}
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    GRN Generated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. DEPARTMENT / UNIT HEAD DASHBOARD
  // -------------------------------------------------------------
  if (isDeptHead) {
    const myDept =
      currentUser?.department || currentUser?.name || "Engineering College";

    // Unit-scoped data
    const myRequisitions = requisitions.filter(
      (r) =>
        !currentUser?.department ||
        r.department?.toLowerCase() === currentUser.department.toLowerCase() ||
        r.requestedByName === currentUser.name,
    );
    const myPendingReqs = requisitions.filter(
      (r) =>
        ["Pending Department Approval", "Pending Approval"].includes(
          r.status,
        ) &&
        (!currentUser?.department ||
          r.department?.toLowerCase() === currentUser.department.toLowerCase()),
    );
    const myReturns = returns.filter(
      (r) =>
        !currentUser?.department ||
        r.department?.toLowerCase() === currentUser.department.toLowerCase() ||
        r.returnedByName === currentUser.name,
    );
    const myPendingReturns = returns.filter(
      (r) =>
        ["Pending Department Approval", "Pending Approval"].includes(
          r.status,
        ) &&
        (!currentUser?.department ||
          r.department?.toLowerCase() === currentUser.department.toLowerCase()),
    );
    const myTransfers = transfers.filter(
      (t) =>
        !currentUser?.department ||
        t.fromStoreName
          ?.toLowerCase()
          .includes(currentUser.department.toLowerCase()) ||
        t.toStoreName
          ?.toLowerCase()
          .includes(currentUser.department.toLowerCase()),
    );
    const myAssets = fixedAssets.filter(
      (f) =>
        !currentUser?.department ||
        f.department?.toLowerCase() === currentUser.department.toLowerCase(),
    );
    const myUserCards = userCards.filter(
      (uc) =>
        !currentUser?.department ||
        uc.department?.toLowerCase() === currentUser.department.toLowerCase(),
    );
    const unitUserCards = myUserCards.length > 0 ? myUserCards : userCards;

    const issuedVouchers = issueVouchers.filter(
      (voucher) => voucher.status === "Issued",
    );

    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Department Head"
          subtitle={`Department & Unit Administration (${myDept}) — Review & authorize staff store requisitions, initiate unit returns, coordinate inter-store transfers, and supervise departmental fixed assets.`}
          badgeText="Unit Approver"
          storeOrDept={myDept}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="clay"
                onClick={() => {
                  setDeptReqForm({
                    department:
                      currentUser?.department || "Engineering College",
                    storeId: stores[0]?.id || "",
                    itemId: items[0]?.id || "",
                    qty: 1,
                  });
                  setDeptReqOpen(true);
                }}
              >
                <Plus size={15} /> New Requisition
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeptReturnForm({
                    itemId: items[0]?.id || "",
                    sourceIssueVoucherId: issuedVouchers[0]?.id || "",
                    qty: 1,
                    reason: "",
                  });
                  setDeptReturnOpen(true);
                }}
              >
                <Undo2 size={15} /> Submit Return
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeptTransferForm({
                    itemId: items[0]?.id || "",
                    qty: 1,
                    fromStoreId: stores[0]?.id || "",
                    toStoreId: stores[1]?.id || stores[0]?.id || "",
                  });
                  setDeptTransferOpen(true);
                }}
              >
                <ArrowLeftRight size={15} /> Transfer Stock
              </Button>
            </div>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Staff Requisitions Pending"
            value={myPendingReqs.length}
            sub="First-level approval before PAO"
            tone={myPendingReqs.length > 0 ? "clay" : "emerald"}
            icon={ClipboardList}
            badge="Dept Approval"
          />
          <StatCard
            label="Staff Returns Pending"
            value={myPendingReturns.length}
            sub="First-level approval before TEC"
            tone={myPendingReturns.length > 0 ? "navy" : "emerald"}
            icon={Undo2}
            badge="Return Review"
          />
          <StatCard
            label="Unit Fixed Assets"
            value={myAssets.length}
            sub="Assets in departmental custody"
            tone="emerald"
            icon={CreditCard}
            badge="Assets"
          />
          <StatCard
            label="Staff User-Cards"
            value={unitUserCards.length}
            sub="Individual custody accounts"
            tone="purple"
            icon={UserCheck}
            badge="Staff Cards"
          />
        </div>

        {/* Dept Head Approval Queue */}
        <div className="mt-6 rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-navy-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Unit Approval Queue — First-Level Review Before PAO &amp; TEC
                </h2>
                <p className="text-xs text-slate-400">
                  As Department Head, approve or reject staff requisitions and
                  material returns before they advance to university-level
                  approval.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-800 ring-1 ring-navy-200">
              {myPendingReqs.length + myPendingReturns.length} Pending
            </span>
          </div>

          {myPendingReqs.length === 0 && myPendingReturns.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                Your unit's approval queues are clear.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No staff requisitions or returns are currently awaiting your
                first-level decision.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Staff Requisitions */}
              {myPendingReqs.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-navy-700" />
                      Staff Store Requisitions — Awaiting Dept Head Approval (
                      {myPendingReqs.length})
                    </p>
                    <Link
                      to="/requisitions?view=staff-approvals"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {myPendingReqs.slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-navy-900">
                              {r.refNo}
                            </span>
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                              {r.status}
                            </span>
                            <span className="text-slate-400">
                              Store: {r.storeName}
                            </span>
                          </div>
                          <p className="text-slate-700 mt-0.5">
                            Material:{" "}
                            <strong>
                              {r.qty}x {r.itemName}
                            </strong>{" "}
                            · Requested by:{" "}
                            <em>{r.requestedByName || "Staff member"}</em>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Department: {r.department || myDept} · Date:{" "}
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideRequisition(r.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2.5 py-1 bg-emerald-50 rounded ring-1 ring-emerald-200"
                          >
                            Approve (Forward to PAO)
                          </button>
                          <button
                            onClick={() => decideRequisition(r.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2.5 py-1 bg-rose-50 rounded ring-1 ring-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Returns */}
              {myPendingReturns.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Undo2 size={14} className="text-amber-600" />
                      Staff Material Returns (SRN) — Awaiting Dept Head Review (
                      {myPendingReturns.length})
                    </p>
                    <Link
                      to="/returns?view=staff-approvals"
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {myPendingReturns.slice(0, 5).map((rt) => (
                      <div
                        key={rt.id}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-navy-900">
                              {rt.refNo}
                            </span>
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                              {rt.status}
                            </span>
                          </div>
                          <p className="text-slate-700 mt-0.5">
                            Material:{" "}
                            <strong>
                              {rt.qty}x {rt.itemName}
                            </strong>{" "}
                            · Returned by:{" "}
                            <em>{rt.returnedByName || "Staff member"}</em>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Reason: "{rt.reason}" · Date:{" "}
                            {new Date(rt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decideReturn(rt.id, "Approved")}
                            className="font-semibold text-emerald-700 hover:underline px-2.5 py-1 bg-emerald-50 rounded ring-1 ring-emerald-200"
                          >
                            Approve (Forward to TEC)
                          </button>
                          <button
                            onClick={() => decideReturn(rt.id, "Rejected")}
                            className="font-semibold text-rose-600 hover:underline px-2.5 py-1 bg-rose-50 rounded ring-1 ring-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dept Head Quick Actions */}
        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-3">
            Department Operations &amp; Property Shortcuts
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => {
                setDeptReqForm({
                  department: currentUser?.department || "Engineering College",
                  storeId: stores[0]?.id || "",
                  itemId: items[0]?.id || "",
                  qty: 1,
                });
                setDeptReqOpen(true);
              }}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    New Requisition
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Request unit materials
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </button>

            <button
              onClick={() => {
                setDeptReturnForm({
                  itemId: items[0]?.id || "",
                  sourceIssueVoucherId: issuedVouchers[0]?.id || "",
                  qty: 1,
                  reason: "",
                });
                setDeptReturnOpen(true);
              }}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                  <Undo2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Submit Return
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Return unneeded items
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </button>

            <button
              onClick={() => {
                setDeptTransferForm({
                  itemId: items[0]?.id || "",
                  qty: 1,
                  fromStoreId: stores[0]?.id || "",
                  toStoreId: stores[1]?.id || stores[0]?.id || "",
                });
                setDeptTransferOpen(true);
              }}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-800">
                  <ArrowLeftRight size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Transfer Request
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Inter-store movement
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </button>

            <Link
              to="/fixed-assets"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Fixed Assets
                  </p>
                  <p className="text-[10px] text-slate-400">Staff User-Cards</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        {/* Unit Fixed Assets Summary */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Unit Fixed Assets ({myAssets.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Non-consumable property and equipment registered under{" "}
                  {myDept}.
                </p>
              </div>
            </div>
            <Link
              to="/fixed-assets"
              className="text-xs font-semibold text-navy-700 hover:underline"
            >
              View Full Register
            </Link>
          </div>
          {myAssets.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No fixed assets registered under {myDept} yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myAssets.slice(0, 6).map((fa) => (
                <div
                  key={fa.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-slate-800">
                      {fa.tag}
                    </span>
                    <span className="ml-2 font-medium text-slate-700">
                      {fa.itemName || "—"}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Custodian:{" "}
                      <strong className="text-slate-600">
                        {fa.custodianName || "Unassigned"}
                      </strong>{" "}
                      · Value: ETB {Number(fa.value || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {fa.status || "In Use"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff User-Cards Panel */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-navy-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Staff User-Cards (Custody by Staff Member)
                </h2>
                <p className="text-xs text-slate-400">
                  Individual custody records for staff members in {myDept}.
                </p>
              </div>
            </div>
            <Link
              to="/fixed-assets"
              className="text-xs font-semibold text-navy-700 hover:underline"
            >
              View All User-Cards
            </Link>
          </div>

          {unitUserCards.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No staff custody records found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unitUserCards.map((uc) => (
                <div
                  key={`${uc.custodianName}-${uc.department}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                    <p className="text-xs font-bold text-slate-800">
                      {uc.custodianName}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {uc.department}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {uc.assets && uc.assets.length > 0 ? (
                      uc.assets.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-700 font-medium truncate max-w-[140px]">
                            {items.find((i) => i.id === a.itemId)?.name ||
                              a.itemName ||
                              "Item"}
                          </span>
                          <span className="font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded ring-1 ring-slate-200">
                            {a.tag}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">
                        No active items assigned.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: New Store Requisition */}
        <Modal
          open={deptReqOpen}
          onClose={() => setDeptReqOpen(false)}
          title="Submit Store Requisition on Behalf of Unit"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeptReqOpen(false)}>
                Cancel
              </Button>
              <Button
                form="dept-req-form"
                type="submit"
                disabled={deptReqSaving}
              >
                {deptReqSaving ? "Submitting…" : "Submit Requisition"}
              </Button>
            </>
          }
        >
          <form id="dept-req-form" onSubmit={handleDeptReqSubmit}>
            <Field label="Consuming Department / Unit">
              <input
                required
                className={inputCls}
                value={deptReqForm.department || myDept}
                onChange={(e) =>
                  setDeptReqForm({
                    ...deptReqForm,
                    department: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Target Store">
              <select
                required
                className={inputCls}
                value={deptReqForm.storeId}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, storeId: e.target.value })
                }
              >
                <option value="">Select store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptReqForm.itemId}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, itemId: e.target.value })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.qtyOnHand} {i.unit} on hand)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptReqForm.qty}
                onChange={(e) =>
                  setDeptReqForm({ ...deptReqForm, qty: e.target.value })
                }
              />
            </Field>
          </form>
        </Modal>

        {/* Modal: Submit Material Return */}
        <Modal
          open={deptReturnOpen}
          onClose={() => setDeptReturnOpen(false)}
          title="Submit Material Return (Store Return Note — SRN)"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeptReturnOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form="dept-return-form"
                type="submit"
                disabled={deptReturnSaving}
              >
                {deptReturnSaving ? "Submitting…" : "Submit Return"}
              </Button>
            </>
          }
        >
          <form id="dept-return-form" onSubmit={handleDeptReturnSubmit}>
            <Field label="Source Issue Voucher (Model 22)">
              <select
                required
                className={inputCls}
                value={deptReturnForm.sourceIssueVoucherId}
                onChange={(e) => {
                  const voucher = issueVouchers.find(
                    (v) => v.id === e.target.value,
                  );
                  setDeptReturnForm({
                    ...deptReturnForm,
                    sourceIssueVoucherId: e.target.value,
                    itemId: voucher?.itemId || deptReturnForm.itemId,
                  });
                }}
              >
                <option value="">Select source voucher…</option>
                {issuedVouchers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.refNo} — {v.qty}x {v.itemName} ({v.storeName})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptReturnForm.itemId}
                onChange={(e) =>
                  setDeptReturnForm({
                    ...deptReturnForm,
                    itemId: e.target.value,
                  })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity to Return">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptReturnForm.qty}
                onChange={(e) =>
                  setDeptReturnForm({ ...deptReturnForm, qty: e.target.value })
                }
              />
            </Field>
            <Field label="Reason / Defect Description">
              <textarea
                required
                rows={3}
                className={inputCls}
                value={deptReturnForm.reason}
                onChange={(e) =>
                  setDeptReturnForm({
                    ...deptReturnForm,
                    reason: e.target.value,
                  })
                }
                placeholder="State the reason for return (e.g. surplus after project completion, defective component)..."
              />
            </Field>
          </form>
        </Modal>

        {/* Modal: Initiate Material Transfer */}
        <Modal
          open={deptTransferOpen}
          onClose={() => setDeptTransferOpen(false)}
          title="Initiate Inter-Store Material Transfer"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeptTransferOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form="dept-transfer-form"
                type="submit"
                disabled={deptTransferSaving}
              >
                {deptTransferSaving ? "Submitting…" : "Submit Transfer Request"}
              </Button>
            </>
          }
        >
          <form id="dept-transfer-form" onSubmit={handleDeptTransferSubmit}>
            <Field label="Material">
              <select
                required
                className={inputCls}
                value={deptTransferForm.itemId}
                onChange={(e) =>
                  setDeptTransferForm({
                    ...deptTransferForm,
                    itemId: e.target.value,
                  })
                }
              >
                <option value="">Select material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={deptTransferForm.qty}
                onChange={(e) =>
                  setDeptTransferForm({
                    ...deptTransferForm,
                    qty: e.target.value,
                  })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From Store">
                <select
                  required
                  className={inputCls}
                  value={deptTransferForm.fromStoreId}
                  onChange={(e) =>
                    setDeptTransferForm({
                      ...deptTransferForm,
                      fromStoreId: e.target.value,
                    })
                  }
                >
                  <option value="">Select…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="To Store">
                <select
                  required
                  className={inputCls}
                  value={deptTransferForm.toStoreId}
                  onChange={(e) =>
                    setDeptTransferForm({
                      ...deptTransferForm,
                      toStoreId: e.target.value,
                    })
                  }
                >
                  <option value="">Select…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {deptTransferForm.fromStoreId &&
              deptTransferForm.fromStoreId === deptTransferForm.toStoreId && (
                <p className="text-xs text-rose-500">
                  Source and destination store must be different.
                </p>
              )}
          </form>
        </Modal>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. ACCOUNTANT / FINANCE OFFICER DASHBOARD
  // -------------------------------------------------------------
  if (isAccountant) {
    const disposedItems = disposals.filter((d) => d.status === "Disposed");
    const pendingWriteOffs = disposals.filter(
      (d) => d.status === "Disposed" && d.method === "Write-off",
    );
    const reconVariances = stockTakes.filter(
      (st) => st.status === "Reconciled",
    );

    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Accountant"
          subtitle="Finance & Property Accounts Directorate — FIFO inventory valuation, ledger reconciliations, asset capitalization, and disposal write-off reporting."
          badgeText="Financial Control"
          storeOrDept="Finance Directorate"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/reports">
                <Button variant="clay">
                  <DollarSign size={15} /> Valuation Reports
                </Button>
              </Link>
              <Link to="/disposal">
                <Button variant="secondary">
                  <Recycle size={15} /> Write-Off Log
                </Button>
              </Link>
            </div>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Inventory Valuation"
            value={`ETB ${totalStockValue.toLocaleString()}`}
            sub={`${items.length} master items (FIFO cost lots)`}
            tone="navy"
            icon={DollarSign}
            badge="Valuation"
          />
          <StatCard
            label="Fixed Assets In Use"
            value={activeFixedAssets.length}
            sub="Active institutional asset register"
            tone="clay"
            icon={CreditCard}
            badge="CapEx"
          />
          <StatCard
            label="Disposed Items"
            value={disposedItems.length}
            sub={`${pendingWriteOffs.length} write-off adjustments`}
            tone="rose"
            icon={Recycle}
            badge="Write-offs"
          />
          <StatCard
            label="Reconciled Stock Takes"
            value={reconVariances.length}
            sub="Physical count variance ledger"
            tone="emerald"
            icon={Scale}
            badge="Reconciliation"
          />
        </div>

        {/* Financial Reporting Quick Actions */}
        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-3">
            Financial Reports & Export
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/reports"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <DollarSign size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Inventory Valuation
                  </p>
                  <p className="text-[10px] text-slate-400">FIFO cost basis</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Fixed Asset Report
                  </p>
                  <p className="text-[10px] text-slate-400">Asset register</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Scale size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Reconciliation
                  </p>
                  <p className="text-[10px] text-slate-400">Take variances</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 text-rose-800">
                  <Recycle size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Disposal Summary
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Write-offs & auctions
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>

        {/* Disposal Write-Off Panel */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Recycle size={16} className="text-rose-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Recent Disposal Write-Offs & Financial Adjustments
              </h2>
            </div>
            <Link
              to="/disposal?view=pending"
              className="text-xs font-semibold text-navy-700 hover:underline"
            >
              View Pending
            </Link>
          </div>
          {disposedItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No disposal write-offs recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {disposedItems.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      {d.refNo}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {d.qty}x {d.itemName}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Method: {d.method || "—"} · {d.reason}
                    </p>
                  </div>
                  <Badge tone="green">Disposed</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. DISPOSAL COMMITTEE DASHBOARD
  // -------------------------------------------------------------
  if (isDisposalCommittee) {
    const pendingForCommittee = disposals.filter(
      (d) => d.status === "Forwarded to Committee",
    );
    const approvedDisposals = disposals.filter((d) => d.status === "Disposed");
    const rejectedDisposals = disposals.filter((d) => d.status === "Rejected");

    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Disposal Committee"
          subtitle="Institutional Disposal Governance Board — Sole legal authorization panel for public property retirement via Auction, Destruction, Donation, or Financial Write-off."
          badgeText="Disposal Authority"
          storeOrDept="Disposal Board"
          actions={
            <Link to="/disposal">
              <Button variant="clay">
                <Recycle size={15} /> Review Disposals
              </Button>
            </Link>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending Committee Decision"
            value={pendingForCommittee.length}
            sub="Disposal requests awaiting authorization"
            tone={pendingForCommittee.length > 0 ? "clay" : "emerald"}
            icon={Recycle}
            badge="Action Required"
          />
          <StatCard
            label="Approved & Disposed"
            value={approvedDisposals.length}
            sub="Permanently retired from records"
            tone="navy"
            icon={CheckCircle2}
            badge="Executed"
          />
          <StatCard
            label="Rejected by Committee"
            value={rejectedDisposals.length}
            sub="Disposal requests denied"
            tone="rose"
            icon={XCircle}
            badge="Denied"
          />
          <StatCard
            label="Total Disposal Requests"
            value={disposals.length}
            sub="All-time disposal dossiers"
            tone="purple"
            icon={ClipboardList}
            badge="Total"
          />
        </div>

        {/* Live Worklist: Pending Disposal Decisions */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Recycle size={18} className="text-clay-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Disposal Requests Awaiting Committee Authorization (
                  {pendingForCommittee.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Review supporting documentation and decide the disposal
                  method: Auction, Destruction, Donation, or Write-off.
                </p>
              </div>
            </div>
            <Link
              to="/disposal"
              className="text-xs font-semibold text-navy-700 hover:underline"
            >
              View All
            </Link>
          </div>

          {pendingForCommittee.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                No disposal requests pending committee review.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                All submitted dossiers have been resolved.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingForCommittee.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-900">
                        {d.refNo}
                      </span>
                      <Badge tone="amber">{d.status}</Badge>
                    </div>
                    <p className="text-slate-700 mt-0.5">
                      Material:{" "}
                      <strong>
                        {d.qty}x {d.itemName}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Justification: "{d.reason}"
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDecideDisposalTarget(d);
                      setDisposalMethod("Auction");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-clay-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay-800 shadow-sm transition-all"
                  >
                    <Recycle size={14} /> Committee Decision
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Committee Decision Modal */}
        <Modal
          open={!!decideDisposalTarget}
          onClose={() => setDecideDisposalTarget(null)}
          title={`Disposal Committee Decision — ${decideDisposalTarget?.refNo || ""}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDecideDisposalTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={savingDisposal}
                onClick={() => handleDisposalDecision("Rejected")}
              >
                {savingDisposal ? "Rejecting…" : "Reject"}
              </Button>
              <Button
                disabled={savingDisposal}
                onClick={() => handleDisposalDecision("Approved")}
              >
                {savingDisposal ? "Authorizing…" : "Authorize Disposal"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
              <p>
                Material: <strong>{decideDisposalTarget?.itemName}</strong>
              </p>
              <p>
                Quantity to Dispose:{" "}
                <strong>{decideDisposalTarget?.qty}</strong>
              </p>
              <p className="mt-1">
                Technical Justification:{" "}
                <em>"{decideDisposalTarget?.reason}"</em>
              </p>
            </div>
            <Field label="Authorized Disposal Method">
              <select
                className={inputCls}
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
              >
                {["Auction", "Destruction", "Donation", "Write-off"].map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <p className="text-xs text-slate-400">
              Authorizing disposal permanently relieves stock via FIFO
              consumption and officially records the board resolution.
            </p>
          </div>
        </Modal>

        {/* Quick Actions */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Committee Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link
              to="/items"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <Tags size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Item Specs
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Technical reference
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/audit-log"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Audit Trail
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Inspection history
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. CAMPUS SECURITY OFFICER DASHBOARD
  // -------------------------------------------------------------
  if (isSecurity) {
    const finalizedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued" && v.model === "Model 22",
    );
    const allIssuedVouchers = issueVouchers.filter(
      (v) => v.status === "Issued",
    );
    const clearedVouchers = issueVouchers.filter(
      (v) => v.gateClearance === true,
    );

    return (
      <div className="animate-fade-in space-y-6">
        <ActorHero
          user={currentUser}
          roleTitle="Campus Security Officer"
          subtitle="Campus Security & Gate Clearance Control — Verify outgoing goods against official Store Issue Vouchers (Model 22), validate gate passes, and log exit clearance timestamps."
          badgeText="Gate Pass Control"
          storeOrDept="Campus Main Gate"
          actions={
            <Link to="/issue-vouchers">
              <Button variant="clay">
                <ShieldAlert size={15} /> All Issued Vouchers
              </Button>
            </Link>
          }
        />

        <WorkflowLifecycleBar
          goodsReceipts={goodsReceipts}
          requisitions={requisitions}
          issueVouchers={issueVouchers}
          returns={returns}
          currentUser={currentUser}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Finalized Vouchers (Model 22)"
            value={allIssuedVouchers.length}
            sub="Authorized store issuances"
            tone="navy"
            icon={CheckSquare}
            badge="Model 22"
          />
          <StatCard
            label="Pending Gate Clearance"
            value={allIssuedVouchers.length - clearedVouchers.length}
            sub="Issued items awaiting exit check"
            tone={allIssuedVouchers.length - clearedVouchers.length > 0 ? "clay" : "emerald"}
            icon={ShieldAlert}
            badge="Gate Queue"
          />
          <StatCard
            label="Gate Clearances Logged"
            value={clearedVouchers.length}
            sub="Verified exit records"
            tone="emerald"
            icon={PackageCheck}
            badge="Cleared"
          />
          <StatCard
            label="Total Vouchers This Month"
            value={
              issueVouchers.filter((v) => {
                const d = new Date(v.createdAt);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length
            }
            sub="Monthly store issue traffic"
            tone="purple"
            icon={ClipboardList}
            badge="Monthly"
          />
        </div>

        {/* Live Worklist: Finalized Vouchers Awaiting Gate Clearance */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-navy-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Finalized Issue Vouchers (Model 22) — Gate Verification
                  Required
                </h2>
                <p className="text-xs text-slate-400">
                  Verify materials against the issued voucher before allowing
                  exit from campus premises.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-800 ring-1 ring-navy-200">
              {allIssuedVouchers.length} Issued
            </span>
          </div>

          {allIssuedVouchers.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-500 mb-2 opacity-80"
              />
              <p className="text-sm font-medium text-slate-700">
                No finalized vouchers pending gate clearance.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                All issued materials have been verified at the gate.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allIssuedVouchers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-900">
                        {v.refNo}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Model 22 — Issued
                      </span>
                      <span className="text-slate-400">
                        Store: {v.storeName}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-0.5">
                      Material:{" "}
                      <strong>
                        {v.qty}x {v.itemName}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Requisition: {v.requisitionRef || "—"} · Issued:{" "}
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {v.gateClearance ? (
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      ✓ Cleared
                    </span>
                  ) : (
                    <button
                      onClick={() => recordGateClearance(v.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 shadow-sm transition-all"
                    >
                      <ShieldAlert size={14} /> Record Gate Clearance
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supporting Reference */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Security Quick Reference
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/issue-vouchers"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-100 text-navy-800">
                  <CheckSquare size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    All Vouchers
                  </p>
                  <p className="text-[10px] text-slate-400">Model 20 & 22</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>

            <Link
              to="/stores"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-navy-300 hover:shadow transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clay-100 text-clay-800">
                  <Warehouse size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Campus Stores
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Location reference
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-400 group-hover:text-navy-700 transition-colors"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 11. OPERATIONAL DEFAULT VIEW FOR OTHER ROLES
  // -------------------------------------------------------------
  return (
    <div className="animate-fade-in space-y-6">
      <ActorHero
        user={currentUser}
        roleTitle={currentUser?.role || "Staff Member"}
        subtitle={`${currentUser?.role || "General"} Dashboard — Live operational overview of material requisitions, store receipts, and active custodial property.`}
        badgeText="Active Session"
        storeOrDept={currentUser?.department || "Institutional Unit"}
      />

      <WorkflowLifecycleBar
        goodsReceipts={goodsReceipts}
        requisitions={requisitions}
        issueVouchers={issueVouchers}
        returns={returns}
        currentUser={currentUser}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Stock Value"
          value={`ETB ${totalStockValue.toLocaleString()}`}
          sub={`${items.length} item types tracked`}
          tone="navy"
          icon={Boxes}
          badge="Valuation"
        />
        <StatCard
          label="Pending TEC Evaluation"
          value={pendingReceipts.length}
          sub="Goods receipts awaiting inspection"
          tone={pendingReceipts.length > 0 ? "clay" : "emerald"}
          icon={PackageCheck}
          badge="Inspection"
        />
        <StatCard
          label="Pending Requisitions"
          value={pendingRequisitions.length}
          sub="Requisitions in approval flow"
          tone={pendingRequisitions.length > 0 ? "amber" : "emerald"}
          icon={ClipboardList}
          badge="Requisitions"
        />
        <StatCard
          label="Pending Disposal"
          value={pendingDisposals.length}
          sub="Flagged items awaiting board review"
          tone="rose"
          icon={Recycle}
          badge="Disposal"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Low Stock &amp; Reorder Alerts
            </h2>
          </div>
          {reorderAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              All items are above their reorder level.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {reorderAlerts.map((a) => (
                <div
                  key={a.itemId}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-700">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-rose-600">
                      {a.qtyOnHand} in stock
                    </p>
                    <Badge
                      tone={
                        a.alertLevel === "Safety Stock Breach" ? "red" : "amber"
                      }
                    >
                      {a.alertLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3">
            {auditLogs.length === 0 && (
              <p className="text-sm text-slate-400">No activity yet.</p>
            )}
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="text-sm">
                <p className="text-slate-700">{log.action}</p>
                <p className="text-xs text-slate-400">
                  {log.userName} · {formatDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
