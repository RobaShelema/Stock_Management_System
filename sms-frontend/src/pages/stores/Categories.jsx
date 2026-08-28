import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function Categories() {
  const { categories, stores, addCategory } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", storeId: "" });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addCategory(form);
    setSaving(false);
    if (ok) {
      setForm({ code: "", name: "", storeId: "" });
      setOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintain Item Category"
        description="Classify items by category, scoped to the store they belong to (main store, department, or cafeteria items)."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New Category
          </Button>
        }
      />

      <DataTable
        searchKeys={["name", "code"]}
        columns={[
          { key: "code", header: "Code" },
          { key: "name", header: "Category Name" },
          { key: "storeName", header: "Belongs To", render: (r) => r.storeName || "—" },
        ]}
        rows={categories}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Item Category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="cat-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Category"}</Button>
          </>
        }
      >
        <form id="cat-form" onSubmit={submit}>
          <Field label="Category Code">
            <input required className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CAT-CHEM" />
          </Field>
          <Field label="Category Name">
            <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Laboratory Supplies" />
          </Field>
          <Field label="Belongs to Store">
            <select required className={inputCls} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
