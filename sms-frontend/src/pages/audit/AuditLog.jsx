import React, { useState } from "react";
import { ShieldCheck, Filter, ShieldAlert } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function AuditLog() {
  const { auditLogs } = useApp();
  const [selectedModule, setSelectedModule] = useState("ALL");

  const modules = ["ALL", ...Array.from(new Set(auditLogs.map((l) => l.module).filter(Boolean)))];

  const filteredLogs =
    selectedModule === "ALL"
      ? auditLogs
      : auditLogs.filter((l) => l.module === selectedModule);

  return (
    <div>
      <PageHeader
        title="Institutional Audit Trail &amp; Activity Log"
        description="A tamper-evident, append-only record of every administrative and transactional action taken across all system modules."
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/70 p-4 text-sm text-navy-800">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-navy-600" />
        <div>
          <p className="font-semibold text-navy-900">
            Cryptographic &amp; Immutable Database Guarantee
          </p>
          <p className="mt-0.5 text-xs text-navy-700">
            Entries are written automatically on every mutating API transaction. PostgreSQL trigger <code>trg_audit_log_append_only</code> permanently rejects <code>UPDATE</code> and <code>DELETE</code> operations.
          </p>
        </div>
      </div>

      {/* Module Filter Pills */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter size={12} /> Module:
        </span>
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedModule(m)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedModule === m
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {m === "ALL" ? `All Modules (${auditLogs.length})` : m}
          </button>
        ))}
      </div>

      <DataTable
        searchKeys={["userName", "action", "module", "role"]}
        columns={[
          {
            key: "createdAt",
            header: "Timestamp",
            render: (r) => (
              <span className="font-mono text-xs text-slate-600">
                {new Date(r.createdAt).toLocaleString()}
              </span>
            ),
          },
          {
            key: "userName",
            header: "Actor",
            render: (r) => (
              <div>
                <p className="font-semibold text-slate-900">{r.userName || "System"}</p>
                {r.role && <p className="text-[11px] text-slate-400">{r.role}</p>}
              </div>
            ),
          },
          {
            key: "module",
            header: "Module",
            render: (r) => <Badge tone="clay">{r.module || "General"}</Badge>,
          },
          {
            key: "action",
            header: "Audit Action Performed",
            render: (r) => <span className="font-medium text-slate-800 text-xs">{r.action}</span>,
          },
        ]}
        rows={filteredLogs}
      />
    </div>
  );
}
