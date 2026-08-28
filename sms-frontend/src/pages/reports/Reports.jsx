import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileDown,
  Scale,
  ArrowLeftRight,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader, Button } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Badge from "../../components/ui/Badge.jsx";

const REPORT_TABS = [
  {
    type: "stock-valuation",
    label: "Inventory Valuation & Health",
    icon: Scale,
  },
  {
    type: "material-movements",
    label: "Material Movement History",
    icon: ArrowLeftRight,
  },
  {
    type: "stock-take-reconciliation",
    label: "Physical Take Reconciliation",
    icon: CheckCircle,
  },
  { type: "stock-status", label: "Stock Status & Levels" },
  { type: "fixed-asset-register", label: "Fixed Asset Register" },
  { type: "supplier-summary", label: "Supplier Summary" },
  { type: "disposal-summary", label: "Disposal Summary" },
  { type: "requisition-summary", label: "Requisition Summary" },
];

export default function Reports() {
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = searchParams.get("type");
  const initialType = REPORT_TABS.some((tab) => tab.type === requestedType)
    ? requestedType
    : REPORT_TABS[0].type;
  const [type, setType] = useState(initialType);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.reports
      .generate(type)
      .then(setRows)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      requestedType &&
      REPORT_TABS.some((tab) => tab.type === requestedType)
    ) {
      setType(requestedType);
    }
  }, [requestedType]);

  function exportCsv() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportServer(format) {
    try {
      const result = await api.reports.export(type, format);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName || `${type}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, "warn");
    }
  }

  return (
    <div>
      <PageHeader
        title="University Inventory &amp; Property Reports"
        description="Generate, inspect, print, and export official inventory valuation, material movement, physical take reconciliation, and asset registers."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} /> Print Report
            </Button>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={16} /> Export CSV
            </Button>
            <Button variant="secondary" onClick={() => exportServer("xlsx")}>
              <FileSpreadsheet size={16} /> Excel
            </Button>
            <Button variant="secondary" onClick={() => exportServer("pdf")}>
              <FileDown size={16} /> PDF
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {REPORT_TABS.map((t) => (
          <button
            key={t.type}
            onClick={() => {
              setType(t.type);
              setSearchParams({ type: t.type });
            }}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              type === t.type
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.icon && <t.icon size={13} />}
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-slate-400 py-6 text-center">
          Generating report data…
        </p>
      )}

      {!loading && type === "stock-valuation" && (
        <DataTable
          searchKeys={["name", "code", "category"]}
          columns={[
            { key: "code", header: "Item Code" },
            { key: "name", header: "Material Name" },
            { key: "category", header: "Category" },
            { key: "qtyOnHand", header: "Qty on Hand" },
            { key: "unit", header: "Unit" },
            {
              key: "defaultUnitCost",
              header: "Unit Cost (ETB)",
              render: (r) =>
                Number(r.defaultUnitCost).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                }),
            },
            {
              key: "totalValuation",
              header: "Total Valuation (ETB)",
              render: (r) => (
                <span className="font-bold text-navy-900">
                  {Number(r.totalValuation).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
            {
              key: "stockHealth",
              header: "Health Status",
              render: (r) => (
                <Badge
                  tone={
                    r.stockHealth.includes("Critical")
                      ? "red"
                      : r.stockHealth.includes("Warning")
                        ? "amber"
                        : "green"
                  }
                >
                  {r.stockHealth}
                </Badge>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "material-movements" && (
        <DataTable
          searchKeys={["code", "itemName", "reference", "type"]}
          columns={[
            {
              key: "createdAt",
              header: "Timestamp",
              render: (r) => new Date(r.createdAt).toLocaleString(),
            },
            { key: "code", header: "Item Code" },
            { key: "itemName", header: "Material" },
            {
              key: "type",
              header: "Movement Type",
              render: (r) => (
                <Badge
                  tone={
                    r.type === "Receipt"
                      ? "green"
                      : r.type === "Issue"
                        ? "clay"
                        : "navy"
                  }
                >
                  {r.type}
                </Badge>
              ),
            },
            { key: "qty", header: "Quantity" },
            { key: "balance", header: "Running Balance" },
            {
              key: "costAmount",
              header: "Movement Cost (ETB)",
              render: (r) => Number(r.costAmount).toLocaleString(),
            },
            { key: "reference", header: "Voucher / Source Ref." },
            {
              key: "processedBy",
              header: "Actor",
              render: (r) => r.processedBy || "—",
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "stock-take-reconciliation" && (
        <DataTable
          searchKeys={["storeName", "itemCode", "itemName"]}
          columns={[
            {
              key: "scheduledDate",
              header: "Take Date",
              render: (r) => new Date(r.scheduledDate).toLocaleDateString(),
            },
            { key: "storeName", header: "Store Unit" },
            { key: "itemCode", header: "Item Code" },
            { key: "itemName", header: "Material" },
            { key: "systemQty", header: "System Qty" },
            { key: "countedQty", header: "Physical Count" },
            {
              key: "discrepancy",
              header: "Variance",
              render: (r) => {
                const diff = Number(r.discrepancy || 0);
                return (
                  <Badge
                    tone={diff === 0 ? "green" : diff > 0 ? "clay" : "red"}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </Badge>
                );
              },
            },
            {
              key: "status",
              header: "Reconciliation Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
            { key: "scheduledBy", header: "Auditor / PAO" },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "stock-status" && (
        <DataTable
          searchKeys={["name", "code"]}
          columns={[
            { key: "code", header: "Code" },
            { key: "name", header: "Item" },
            { key: "category", header: "Category" },
            { key: "qtyOnHand", header: "On Hand" },
            { key: "reorderLevel", header: "Reorder Level" },
            {
              key: "estimatedValue",
              header: "Value (ETB)",
              render: (r) => Number(r.estimatedValue).toLocaleString(),
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "fixed-asset-register" && (
        <DataTable
          searchKeys={["tag", "custodianName"]}
          columns={[
            { key: "tag", header: "Asset Tag" },
            { key: "itemName", header: "Description" },
            { key: "custodianName", header: "Custodian" },
            { key: "department", header: "Department" },
            {
              key: "value",
              header: "Value (ETB)",
              render: (r) => Number(r.value).toLocaleString(),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "supplier-summary" && (
        <DataTable
          searchKeys={["name"]}
          columns={[
            { key: "name", header: "Supplier" },
            { key: "contact", header: "Contact" },
            { key: "phone", header: "Phone" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "disposal-summary" && (
        <DataTable
          searchKeys={["refNo"]}
          columns={[
            { key: "refNo", header: "Ref. No." },
            { key: "itemName", header: "Material" },
            { key: "qty", header: "Qty" },
            { key: "method", header: "Method", render: (r) => r.method || "—" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
          ]}
          rows={rows}
        />
      )}

      {!loading && type === "requisition-summary" && (
        <DataTable
          searchKeys={["refNo", "department"]}
          columns={[
            { key: "refNo", header: "Ref. No." },
            { key: "department", header: "Department" },
            { key: "itemName", header: "Material" },
            { key: "qty", header: "Qty" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
