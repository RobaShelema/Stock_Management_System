import React, { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Server,
  HardDriveDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Clock,
  ShieldCheck,
  FileJson,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, StatCard } from "../../components/ui/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function SystemHealth() {
  const { getSystemHealth, triggerBackup, showToast, currentUser } = useApp();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const isAdmin = currentUser?.role === "Administrator";

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    setLoading(true);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      showToast(err.message || "Failed to fetch health telemetry", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    const { ok, result } = await triggerBackup();
    setBackingUp(false);
    if (ok && result) {
      setLastBackup(result);
      // Auto-trigger browser download of the backup JSON file
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.backupId || "system-backup"}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      fetchHealth();
    }
  }

  function formatUptime(seconds) {
    if (!seconds) return "—";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  }

  return (
    <div>
      <PageHeader
        title="System Health & Data Backups"
        description="Monitor live database diagnostics, server telemetry, and trigger verified database backup snapshots."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchHealth} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Telemetry
            </Button>
            {isAdmin && (
              <Button onClick={handleBackup} disabled={backingUp}>
                <HardDriveDownload size={15} className={backingUp ? "animate-bounce" : ""} />
                {backingUp ? "Generating Backup…" : "Trigger Data Backup"}
              </Button>
            )}
          </div>
        }
      />

      {/* System Status Summary Banner */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-950">
              System Core & Database Engine: {health?.status || "Healthy"}
            </p>
            <p className="text-xs text-emerald-800">
              PostgreSQL database latency: <strong>{health?.database?.latencyMs ?? 0} ms</strong> · PostgreSQL Connection Pool: Active
            </p>
          </div>
        </div>
        <Badge tone="green">Production Operational</Badge>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Server Uptime"
          value={formatUptime(health?.uptimeSeconds)}
          sub="Continuous node runtime"
          tone="navy"
          icon={Clock}
        />
        <StatCard
          label="Database Status"
          value={health?.database?.status === "Connected" ? "Active" : "Degraded"}
          sub={`${health?.database?.latencyMs ?? 0}ms query latency`}
          tone="clay"
          icon={Database}
        />
        <StatCard
          label="Memory Usage (RSS)"
          value={`${health?.system?.memoryRssMb ?? 0} MB`}
          sub={`Heap: ${health?.system?.memoryHeapUsedMb ?? 0} / ${health?.system?.memoryHeapTotalMb ?? 0} MB`}
          tone="light"
          icon={Cpu}
        />
        <StatCard
          label="Audit Log Entries"
          value={health?.counts?.auditLogs ?? 0}
          sub="Immutable records stored"
          tone="light"
          icon={ShieldCheck}
        />
      </div>

      {/* Entity Record Summary */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-clay-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Database Table Statistics & Entity Counts
              </h2>
            </div>
            <span className="text-xs text-slate-400">PostgreSQL Schema v1.0</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">User Accounts</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.users ?? 0}</p>
              <p className="text-[10px] text-slate-400">Preserved with audit trails</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Configured Stores</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.stores ?? 0}</p>
              <p className="text-[10px] text-slate-400">Main, Dept & Cafeteria</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Master Items</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.items ?? 0}</p>
              <p className="text-[10px] text-slate-400">Consumables & Fixed Assets</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Registered Suppliers</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.suppliers ?? 0}</p>
              <p className="text-[10px] text-slate-400">Active & Deactivated</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Goods Receipts</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.goodsReceipts ?? 0}</p>
              <p className="text-[10px] text-slate-400">Recorded shipments</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs text-slate-500 font-medium">Store Requisitions</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{health?.counts?.requisitions ?? 0}</p>
              <p className="text-[10px] text-slate-400">Demand vouchers</p>
            </div>
          </div>
        </div>

        {/* Trigger Backup Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HardDriveDownload size={18} className="text-navy-700" />
              <h2 className="text-sm font-semibold text-slate-800">
                On-Demand Data Backup
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Triggering a backup extracts a consistent JSON snapshot of all system tables, configurations, and append-only audit ledgers, securely downloadable to local storage.
            </p>

            {lastBackup && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 mb-4">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" /> Backup Created & Downloaded
                </p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  ID: <strong>{lastBackup.backupId}</strong>
                </p>
                <p className="text-[10px] text-emerald-700">
                  {new Date(lastBackup.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleBackup}
            disabled={backingUp}
            className="w-full justify-center py-2.5"
          >
            <HardDriveDownload size={16} />
            {backingUp ? "Extracting Snapshot…" : "Generate & Download Backup"}
          </Button>
        </div>
      </div>
    </div>
  );
}
