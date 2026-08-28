import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function Transfers() {
  const { transfers, items, stores, addTransfer, decideTransfer, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", qty: 1, fromStoreId: "", toStoreId: "" });

  const canApprove = ["Property Administration Officer"].includes(currentUser?.role);
  const canRequest = ["Store Head", "Department Head"].includes(currentUser?.role);


  async function submit(e) {
    e.preventDefault();
    if (form.fromStoreId === form.toStoreId) return;
    setSaving(true);
    const { ok } = await addTransfer({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ itemId: "", qty: 1, fromStoreId: "", toStoreId: "" });
      setOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inter-Store Material Transfer"
        description="Move materials between stores with PAO approval; approved transfers post a Bin Card movement at both ends."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Transfer Request
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo"]}
        columns={[
          { key: "refNo", header: "Ref. No." },
          { key: "itemName", header: "Material", render: (r) => r.itemName || "—" },
          { key: "qty", header: "Qty" },
          { key: "fromStoreName", header: "From", render: (r) => r.fromStoreName || "—" },
          { key: "toStoreName", header: "To", render: (r) => r.toStoreName || "—" },
          { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          {
            key: "actions",
            header: "Action",
            render: (r) =>
              r.status === "Pending Approval" && canApprove ? (
                <div className="flex gap-2">
                  <button onClick={() => decideTransfer(r.id, "Approved")} className="text-xs font-medium text-emerald-700 hover:underline">Approve</button>
                  <button onClick={() => decideTransfer(r.id, "Rejected")} className="text-xs font-medium text-rose-600 hover:underline">Reject</button>
                </div>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              ),
          },
        ]}
        rows={transfers}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Initiate Material Transfer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="tr-form" type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit Request"}</Button>
          </>
        }
      >
        <form id="tr-form" onSubmit={submit}>
          <Field label="Material">
            <select required className={inputCls} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input type="number" min="1" required className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Store">
              <select required className={inputCls} value={form.fromStoreId} onChange={(e) => setForm({ ...form, fromStoreId: e.target.value })}>
                <option value="">Select…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="To Store">
              <select required className={inputCls} value={form.toStoreId} onChange={(e) => setForm({ ...form, toStoreId: e.target.value })}>
                <option value="">Select…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>
          {form.fromStoreId && form.fromStoreId === form.toStoreId && (
            <p className="text-xs text-rose-500">Source and destination store must be different.</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
