import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function ItemLocations() {
  const { itemLocations, items, stores, upsertItemLocation, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", storeId: "", bin: "" });

  const canMaintain = ["Store Head", "Stock Clerk", "Property Administration Officer"].includes(currentUser?.role);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await upsertItemLocation(form);
    setSaving(false);
    if (ok) {
      setForm({ itemId: "", storeId: "", bin: "" });
      setOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintain Item Bin &amp; Shelf Locations"
        description="Assign, relocate, and maintain physical shelf and bin locations of materials within campus stores."
        action={
          canMaintain && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Update Location
            </Button>
          )
        }
      />


      <DataTable
        searchKeys={["bin", "itemName", "storeName"]}
        columns={[
          { key: "itemName", header: "Material", render: (r) => r.itemName || "—" },
          { key: "storeName", header: "Store", render: (r) => r.storeName || "—" },
          { key: "bin", header: "Bin / Location" },
          {
            key: "updatedAt",
            header: "Last Updated",
            render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"),
          },
        ]}
        rows={itemLocations}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Update Item Location"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="loc-form" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Location"}</Button>
          </>
        }
      >
        <form id="loc-form" onSubmit={submit}>
          <Field label="Material">
            <select required className={inputCls} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Store">
            <select required className={inputCls} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Bin / Shelf Location">
            <input required className={inputCls} value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} placeholder="e.g. BIN-D4" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
