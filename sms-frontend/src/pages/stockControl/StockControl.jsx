import React, { useEffect, useState } from "react";
import { CalendarPlus, ClipboardCheck, Scale, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

const TABS = [
  { key: "alerts", label: "Reorder & Safety-Stock Alerts", icon: AlertTriangle },
  { key: "stockTakes", label: "Physical Stock Taking", icon: ClipboardCheck },
  { key: "valuation", label: "FIFO Valuation", icon: Scale },
];

export default function StockControl() {
  const [tab, setTab] = useState("alerts");

  return (
    <div>
      <PageHeader
        title="Stock Monitoring, Stock Taking & Valuation"
        description="Continuous reorder monitoring, periodic physical stock taking with reconciliation, and FIFO inventory valuation."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-navy-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "alerts" && <AlertsTab />}
      {tab === "stockTakes" && <StockTakesTab />}
      {tab === "valuation" && <ValuationTab />}
    </div>
  );
}

function AlertsTab() {
  const { reorderAlerts } = useApp();
  return (
    <DataTable
      searchKeys={["name", "code"]}
      columns={[
        { key: "code", header: "Code" },
        { key: "name", header: "Item" },
        { key: "qtyOnHand", header: "On Hand" },
        { key: "reorderLevel", header: "Reorder Level" },
        { key: "safetyStockLevel", header: "Safety Stock" },
        {
          key: "alertLevel",
          header: "Alert",
          render: (r) => <Badge tone={r.alertLevel === "Safety Stock Breach" ? "red" : "amber"}>{r.alertLevel}</Badge>,
        },
      ]}
      rows={reorderAlerts}
      emptyLabel="No items are currently at or below their reorder level."
    />
  );
}

function StockTakesTab() {
  const { stockTakes, stores, scheduleStockTake, recordStockTakeCount, reconcileStockTake, currentUser, showToast } =
    useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeId: "", scheduledDate: new Date().toISOString().slice(0, 10) });

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [findings, setFindings] = useState({});

  const canSchedule = ["Property Administration Officer"].includes(currentUser?.role);
  const canCount = ["Store Head", "Stock Clerk"].includes(currentUser?.role);
  const canReconcile = ["Property Administration Officer"].includes(currentUser?.role);


  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    api.stockControl
      .getStockTake(detailId)
      .then(setDetail)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoadingDetail(false));
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitSchedule(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await scheduleStockTake(form);
    setSaving(false);
    if (ok) {
      setForm({ storeId: "", scheduledDate: new Date().toISOString().slice(0, 10) });
      setOpen(false);
    }
  }

  async function submitCount(lineId, countedQty) {
    const { ok } = await recordStockTakeCount(detailId, lineId, Number(countedQty));
    if (ok) {
      const updated = await api.stockControl.getStockTake(detailId);
      setDetail(updated);
    }
  }

  async function submitReconcile() {
    const { ok } = await reconcileStockTake(detailId, findings);
    if (ok) {
      setDetailId(null);
      setFindings({});
    }
  }

  const allCounted = detail?.lines?.every((l) => l.countedQty !== null) ?? false;
  const discrepantLines = detail?.lines?.filter((l) => Number(l.countedQty) !== Number(l.systemQty)) ?? [];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canSchedule && (
          <Button onClick={() => setOpen(true)}>
            <CalendarPlus size={16} /> Schedule Stock Take
          </Button>
        )}
      </div>

      <DataTable
        searchKeys={["storeName"]}
        columns={[
          { key: "storeName", header: "Store" },
          { key: "scheduledDate", header: "Scheduled Date", render: (r) => new Date(r.scheduledDate).toLocaleDateString() },
          { key: "scheduledByName", header: "Scheduled By" },
          { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <button onClick={() => setDetailId(r.id)} className="text-xs font-medium text-navy-700 hover:underline">
                {r.status === "Reconciled" ? "View" : "Count / Reconcile"}
              </button>
            ),
          },
        ]}
        rows={stockTakes}
        emptyLabel="No stock takes scheduled yet."
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule Physical Stock Take"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="st-form" type="submit" disabled={saving}>{saving ? "Scheduling…" : "Schedule"}</Button>
          </>
        }
      >
        <form id="st-form" onSubmit={submitSchedule}>
          <Field label="Store">
            <select required className={inputCls} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Scheduled Date">
            <input type="date" required className={inputCls} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-400">
            Every item currently located in the selected store is captured as a count line, with its system quantity locked in at scheduling time.
          </p>
        </form>
      </Modal>

      <Modal
        open={!!detailId}
        onClose={() => { setDetailId(null); setFindings({}); }}
        title={`Stock Take — ${detail?.storeName || ""}`}
        width="max-w-2xl"
        footer={
          detail?.status !== "Reconciled" && canReconcile ? (
            <>
              <Button variant="secondary" onClick={() => { setDetailId(null); setFindings({}); }}>Close</Button>
              <Button onClick={submitReconcile} disabled={!allCounted}>
                Reconcile {discrepantLines.length > 0 ? `(${discrepantLines.length} discrepancy)` : ""}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => { setDetailId(null); setFindings({}); }}>Close</Button>
          )
        }
      >
        {loadingDetail && <p className="text-sm text-slate-400">Loading…</p>}
        {!loadingDetail && detail && (
          <div className="space-y-3">
            {!allCounted && detail.status !== "Reconciled" && (
              <p className="text-xs text-amber-600">All items must be counted before this stock take can be reconciled.</p>
            )}
            {detail.lines.map((line) => {
              const counted = line.countedQty !== null;
              const discrepancy = counted ? Number(line.countedQty) - Number(line.systemQty) : null;
              return (
                <div key={line.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{line.name}</p>
                      <p className="text-xs text-slate-400">{line.code} · system qty: {line.systemQty}</p>
                    </div>
                    {detail.status !== "Reconciled" && canCount ? (
                      <CountInput lineId={line.id} defaultValue={line.countedQty} onSubmit={submitCount} />
                    ) : (
                      <span className="text-sm font-semibold text-slate-700">{line.countedQty ?? "—"}</span>
                    )}
                  </div>
                  {counted && discrepancy !== 0 && (
                    <div className="mt-2">
                      <Badge tone={discrepancy > 0 ? "green" : "red"}>
                        {discrepancy > 0 ? `+${discrepancy}` : discrepancy} discrepancy
                      </Badge>
                      {detail.status !== "Reconciled" && canReconcile && (
                        <input
                          className={inputCls + " mt-2"}
                          placeholder="Finding / explanation for this discrepancy…"
                          value={findings[line.id] || ""}
                          onChange={(e) => setFindings({ ...findings, [line.id]: e.target.value })}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

function CountInput({ lineId, defaultValue, onSubmit }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
        placeholder="Count"
      />
      <button
        onClick={() => value !== "" && onSubmit(lineId, value)}
        className="rounded-md bg-navy-800 px-2 py-1 text-xs font-medium text-white hover:bg-navy-700"
      >
        Save
      </button>
    </div>
  );
}

function ValuationTab() {
  const { items, showToast } = useApp();
  const [itemId, setItemId] = useState("");
  const [valuation, setValuation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.stockControl
      .valuation(itemId || undefined)
      .then((res) => {
        if (itemId) {
          setValuation(res);
          setSummary(null);
        } else {
          setSummary(res);
          setValuation(null);
        }
      })
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <Field label="Filter by item (optional)">
          <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">All items — organization-wide summary</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {loading && <p className="text-sm text-slate-400">Computing valuation…</p>}

      {!loading && summary && (
        <>
          <div className="mb-4 rounded-xl bg-navy-800 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">Grand Total Inventory Value</p>
            <p className="text-2xl font-bold">ETB {summary.grandTotal.toLocaleString()}</p>
          </div>
          <DataTable
            searchKeys={["name", "code"]}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Item" },
              { key: "totalQtyRemaining", header: "Qty Remaining" },
              { key: "totalValue", header: "FIFO Value (ETB)", render: (r) => Number(r.totalValue).toLocaleString() },
            ]}
            rows={summary.items}
          />
        </>
      )}

      {!loading && valuation && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Qty Remaining</p>
              <p className="text-xl font-bold text-slate-800">{valuation.totalQtyRemaining}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Total FIFO Value</p>
              <p className="text-xl font-bold text-slate-800">ETB {valuation.totalValue.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">Average Unit Cost</p>
              <p className="text-xl font-bold text-slate-800">ETB {valuation.averageUnitCost.toFixed(2)}</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "sourceReference", header: "Source (GRN/Adjustment)" },
              { key: "receivedAt", header: "Received", render: (r) => new Date(r.receivedAt).toLocaleDateString() },
              { key: "qtyReceived", header: "Qty Received" },
              { key: "qtyRemaining", header: "Qty Remaining" },
              { key: "unitCost", header: "Unit Cost (ETB)", render: (r) => Number(r.unitCost).toLocaleString() },
              { key: "lineValue", header: "Line Value (ETB)", render: (r) => Number(r.lineValue).toLocaleString() },
            ]}
            rows={valuation.lots}
            emptyLabel="No remaining cost lots for this item."
          />
        </>
      )}
    </div>
  );
}
