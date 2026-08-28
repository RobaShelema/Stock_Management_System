import React, { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import {
  PageHeader,
  Button,
  Field,
  inputCls,
} from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";

const emptyForm = {
  code: "",
  name: "",
  categoryId: "",
  unit: "Piece",
  type: "Consumable",
  reorderLevel: 5,
  safetyStockLevel: 2,
  openingQty: 0,
  unitCost: 0,
  expiryDate: "",
  storeId: "",
  bin: "SHELF-A1",
};

export default function ItemsPage() {
  const { items, categories, stores, addItem } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addItem({
      ...form,
      reorderLevel: Number(form.reorderLevel),
      safetyStockLevel: Number(form.safetyStockLevel),
      openingQty: Number(form.openingQty),
      unitCost: Number(form.unitCost),
    });
    setSaving(false);
    if (ok) {
      setForm(emptyForm);
      setOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Item Master"
        description="Master list of all materials, both fixed assets and consumables, with reorder levels and FIFO valuation."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New Item
          </Button>
        }
      />

      <DataTable
        searchKeys={["name", "code"]}
        columns={[
          { key: "code", header: "Code" },
          { key: "name", header: "Item Name" },
          {
            key: "categoryName",
            header: "Category",
            render: (r) => r.categoryName || "—",
          },
          { key: "type", header: "Type" },
          {
            key: "qtyOnHand",
            header: "On Hand",
            render: (r) => {
              const low = Number(r.qtyOnHand) <= Number(r.reorderLevel);
              return (
                <span
                  className={
                    low ? "font-semibold text-rose-600" : "text-slate-700"
                  }
                >
                  {r.qtyOnHand} {r.unit}
                  {low && <AlertTriangle size={12} className="ml-1 inline" />}
                </span>
              );
            },
          },
          { key: "reorderLevel", header: "Reorder Level" },
          { key: "safetyStockLevel", header: "Safety Stock" },
          {
            key: "expiryDate",
            header: "Expiry Date",
            render: (r) => r.expiryDate || "—",
          },
          {
            key: "shelfLifeStatus",
            header: "Shelf Life",
            render: (r) => r.shelfLifeStatus || "Available",
          },
          {
            key: "defaultUnitCost",
            header: "Unit Cost (ETB)",
            render: (r) => Number(r.defaultUnitCost).toLocaleString(),
          },
        ]}
        rows={items}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register New Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="item-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Item"}
            </Button>
          </>
        }
      >
        <form id="item-form" onSubmit={submit}>
          <Field label="Item Code">
            <input
              required
              className={inputCls}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. ITM-0008"
            />
          </Field>
          <Field label="Item Name">
            <input
              required
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <select
              required
              className={inputCls}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit of Measure">
              <input
                className={inputCls}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Field>
            <Field label="Item Type">
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Consumable</option>
                <option>Fixed Asset</option>
              </select>
            </Field>
          </div>
          <Field label="Default Expiry Date (optional)">
            <input
              type="date"
              className={inputCls}
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reorder Level">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm({ ...form, reorderLevel: e.target.value })
                }
              />
            </Field>
            <Field label="Safety Stock Level">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.safetyStockLevel}
                onChange={(e) =>
                  setForm({ ...form, safetyStockLevel: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening Qty">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.openingQty}
                onChange={(e) =>
                  setForm({ ...form, openingQty: e.target.value })
                }
              />
            </Field>
            <Field label="Unit Cost (ETB)">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              />
            </Field>
          </div>

          {Number(form.openingQty) > 0 && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-navy-100 bg-navy-50/50 p-3">
              <Field label="Receiving Store">
                <select
                  required
                  className={inputCls}
                  value={form.storeId}
                  onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                >
                  <option value="">Select store for opening stock…</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bin / Shelf Location">
                <input
                  required
                  className={inputCls}
                  value={form.bin}
                  onChange={(e) => setForm({ ...form, bin: e.target.value })}
                  placeholder="e.g. BIN-A1"
                />
              </Field>
            </div>
          )}

          <p className="text-xs text-slate-400">
            An opening quantity greater than zero creates the item's first FIFO
            cost lot at the given unit cost and updates the store's bin ledger.
          </p>
        </form>
      </Modal>
    </div>
  );
}
