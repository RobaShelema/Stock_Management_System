import React, { useState } from "react";
import { Plus, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import {
  PageHeader,
  Button,
  Field,
  inputCls,
} from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function GoodsReceipt() {
  const {
    goodsReceipts,
    items,
    suppliers,
    stores,
    addGoodsReceipt,
    evaluateGoodsReceipt,
    generateGRN,
    currentUser,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [evalTarget, setEvalTarget] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    storeId: "",
    itemId: "",
    qty: 1,
    poReference: "",
    expiryDate: "",
  });

  const [grnTarget, setGrnTarget] = useState(null);
  const [grnForm, setGrnForm] = useState({
    unitCost: 0,
    bin: "RECEIVING",
  });
  const [grnSaving, setGrnSaving] = useState(false);

  const isTEC = ["Technical Evaluation Committee", "Administrator"].includes(
    currentUser?.role,
  );
  const canFinalize = ["Property Registration Officer"].includes(
    currentUser?.role,
  );
  const canRecord = [
    "Store Head",
    "Stock Clerk",
    "Property Administration Officer",
    "Administrator",
  ].includes(currentUser?.role);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addGoodsReceipt({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({
        supplierId: "",
        storeId: "",
        itemId: "",
        qty: 1,
        poReference: "",
        expiryDate: "",
      });
      setOpen(false);
    }
  }

  async function submitEvaluation(decision) {
    const { ok } = await evaluateGoodsReceipt(evalTarget.id, decision, remarks);
    if (ok) {
      setEvalTarget(null);
      setRemarks("");
    }
  }

  function openGrnModal(receipt) {
    const item = items.find((i) => i.id === receipt.itemId);
    setGrnTarget(receipt);
    setGrnForm({
      unitCost: item?.defaultUnitCost ? Number(item.defaultUnitCost) : 0,
      bin: "RECEIVING",
    });
  }

  async function submitGrn(e) {
    e.preventDefault();
    if (!grnTarget) return;
    setGrnSaving(true);
    const { ok } = await generateGRN(
      grnTarget.id,
      Number(grnForm.unitCost),
      grnForm.bin,
    );
    setGrnSaving(false);
    if (ok) {
      setGrnTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Goods Receipt, Technical Evaluation & GRN"
        description="Record incoming materials, route them to the Technical Evaluation Committee, then generate the official Goods Receiving Note (Model 19)."
        action={
          canRecord && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Record Goods Receipt
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "poReference"]}
        columns={[
          { key: "refNo", header: "Receipt Ref." },
          {
            key: "supplierName",
            header: "Supplier",
            render: (r) => r.supplierName || "—",
          },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          { key: "qty", header: "Qty" },
          {
            key: "storeName",
            header: "Store",
            render: (r) => r.storeName || "—",
          },
          { key: "poReference", header: "PO / Donation Ref." },
          {
            key: "expiryDate",
            header: "Expiry Date",
            render: (r) => r.expiryDate || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "grnNumber",
            header: "GRN No.",
            render: (r) => r.grnNumber || "—",
          },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <div className="flex gap-2">
                {r.status === "Awaiting Evaluation" && isTEC && (
                  <button
                    onClick={() => setEvalTarget(r)}
                    className="text-xs font-medium text-navy-700 hover:underline"
                  >
                    Evaluate
                  </button>
                )}
                {r.status === "Approved" && canFinalize && (
                  <button
                    onClick={() => openGrnModal(r)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    <FileText size={12} /> Generate GRN (Model 19)
                  </button>
                )}
                {(r.status === "GRN Generated" || r.status === "Rejected") && (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            ),
          },
        ]}
        rows={goodsReceipts}
      />

      {/* Record Goods Receipt Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Goods Receipt"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="gr-form" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit for TEC Evaluation"}
            </Button>
          </>
        }
      >
        <form id="gr-form" onSubmit={submit}>
          <Field label="Supplier / Donor">
            <select
              required
              className={inputCls}
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">Select a supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Receiving Store">
            <select
              required
              className={inputCls}
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Material Received">
            <select
              required
              className={inputCls}
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            >
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity Received">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </Field>
            <Field label="Purchase / Donation Ref.">
              <input
                required
                className={inputCls}
                value={form.poReference}
                onChange={(e) =>
                  setForm({ ...form, poReference: e.target.value })
                }
                placeholder="PO-2026-00xx"
              />
            </Field>
          </div>
          <Field label="Batch Expiry Date (optional)">
            <input
              type="date"
              className={inputCls}
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </Field>
          <p className="mt-1 text-xs text-slate-400">
            This creates an official receipt record. The Technical Evaluation
            Committee will be notified automatically for physical inspection.
          </p>
        </form>
      </Modal>

      {/* Technical Evaluation Modal */}
      <Modal
        open={!!evalTarget}
        onClose={() => setEvalTarget(null)}
        title={`Evaluate Receipt — ${evalTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEvalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => submitEvaluation("Rejected")}
            >
              <XCircle size={14} /> Reject
            </Button>
            <Button onClick={() => submitEvaluation("Approved")}>
              <CheckCircle2 size={14} /> Approve
            </Button>
          </>
        }
      >
        {evalTarget && (
          <div>
            <p className="mb-2 text-sm text-slate-600">
              Material:{" "}
              <span className="font-medium text-slate-800">
                {evalTarget.itemName}
              </span>{" "}
              — Qty {evalTarget.qty}
            </p>
            <p className="mb-3 text-sm text-slate-600">
              PO / Donation reference:{" "}
              <span className="font-medium text-slate-800">
                {evalTarget.poReference}
              </span>
            </p>
            <Field label="Inspection Remarks">
              <textarea
                rows={3}
                className={inputCls}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Note specification/quality findings…"
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* Generate Model 19 GRN Modal */}
      <Modal
        open={!!grnTarget}
        onClose={() => setGrnTarget(null)}
        title={`Generate Goods Receiving Note (Model 19) — ${grnTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGrnTarget(null)}>
              Cancel
            </Button>
            <Button form="grn-form" type="submit" disabled={grnSaving}>
              {grnSaving ? "Generating GRN…" : "Confirm & Issue Model 19"}
            </Button>
          </>
        }
      >
        {grnTarget && (
          <form id="grn-form" onSubmit={submitGrn}>
            <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <p>
                <strong>Receipt Ref:</strong> {grnTarget.refNo}
              </p>
              <p>
                <strong>Material:</strong> {grnTarget.qty}x {grnTarget.itemName}
              </p>
              <p>
                <strong>Receiving Store:</strong> {grnTarget.storeName}
              </p>
              <p>
                <strong>Supplier:</strong> {grnTarget.supplierName}
              </p>
            </div>
            <Field label="Unit Cost (ETB)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className={inputCls}
                value={grnForm.unitCost}
                onChange={(e) =>
                  setGrnForm({ ...grnForm, unitCost: e.target.value })
                }
              />
            </Field>
            <Field label="Assigned Store Bin / Shelf Location">
              <input
                required
                className={inputCls}
                value={grnForm.bin}
                onChange={(e) =>
                  setGrnForm({ ...grnForm, bin: e.target.value })
                }
                placeholder="e.g. RECEIVING, BIN-A1, SHELF-02"
              />
            </Field>
            <p className="mt-2 text-xs text-slate-400">
              Generating the GRN finalizes the receipt, creates a FIFO cost lot,
              increments Quantity on Hand, and updates the store's bin card.
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
