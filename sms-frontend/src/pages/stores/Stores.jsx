import React, { useState } from "react";
import { Plus, Edit2, Warehouse, UserCheck, UserX } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function Stores() {
  const { stores, users, addStore, updateStore, toggleStoreStatus, currentUser } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    type: "Main Store",
    headUserId: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    code: "",
    name: "",
    type: "Main Store",
    headUserId: "",
  });

  const canManage =
    currentUser?.role === "Administrator" ||
    currentUser?.role === "Property Administration Officer";

  const storeHeadCandidates = users.filter(
    (u) => (u.status === "Active" || !u.status) && (u.role === "Store Head" || u.role === "Stock Clerk")
  );

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addStore(createForm);
    setSaving(false);
    if (ok) {
      setCreateForm({ code: "", name: "", type: "Main Store", headUserId: "" });
      setCreateOpen(false);
    }
  }

  function startEdit(store) {
    setEditForm({
      id: store.id,
      code: store.code,
      name: store.name,
      type: store.type,
      headUserId: store.headUserId || "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await updateStore(editForm.id, {
      code: editForm.code,
      name: editForm.name,
      type: editForm.type,
      headUserId: editForm.headUserId || null,
    });
    setSaving(false);
    if (ok) {
      setEditOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Store Units & Campus Warehouses"
        description="Configure university central stores, departmental stores, and specialized cafeteria warehouses."
        action={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New Store Unit
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["name", "code", "type", "headName"]}
        columns={[
          {
            key: "code",
            header: "Store Code",
            render: (r) => <span className="font-mono font-bold text-navy-900">{r.code}</span>,
          },
          { key: "name", header: "Store Name" },
          {
            key: "type",
            header: "Store Classification",
            render: (r) => (
              <Badge tone={r.type === "Main Store" ? "navy" : "clay"}>{r.type}</Badge>
            ),
          },
          {
            key: "headName",
            header: "Designated Store Head",
            render: (r) => r.headName || <span className="text-slate-400 italic">Unassigned</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge tone={r.status === "Active" || !r.status ? "green" : "red"}>
                {r.status || "Active"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) =>
              canManage ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(r)}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => toggleStoreStatus(r.id)}
                    className={`flex items-center gap-1 text-xs font-semibold hover:underline ${
                      r.status === "Inactive"
                        ? "text-emerald-700 hover:text-emerald-900"
                        : "text-rose-600 hover:text-rose-800"
                    }`}
                  >
                    {r.status === "Inactive" ? (
                      <>
                        <UserCheck size={13} /> Reactivate
                      </>
                    ) : (
                      <>
                        <UserX size={13} /> Deactivate
                      </>
                    )}
                  </button>
                </div>
              ) : null,
          },
        ]}
        rows={stores}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New Store Unit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-store-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Store"}
            </Button>
          </>
        }
      >
        <form id="create-store-form" onSubmit={handleCreate}>
          <Field label="Store Code">
            <input
              required
              className={inputCls}
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
              placeholder="e.g. DS-04"
            />
          </Field>
          <Field label="Store Name">
            <input
              required
              className={inputCls}
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Health Science Department Store"
            />
          </Field>
          <Field label="Store Type">
            <select
              className={inputCls}
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
            >
              <option value="Main Store">Main Store</option>
              <option value="Department Store">Department Store</option>
              <option value="Cafeteria Store">Cafeteria Store</option>
            </select>
          </Field>
          <Field label="Designated Store Head (Optional)">
            <select
              className={inputCls}
              value={createForm.headUserId}
              onChange={(e) => setCreateForm({ ...createForm, headUserId: e.target.value })}
            >
              <option value="">-- None Assigned --</option>
              {storeHeadCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Configure Store Unit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button form="edit-store-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update Store"}
            </Button>
          </>
        }
      >
        <form id="edit-store-form" onSubmit={handleEdit}>
          <Field label="Store Code">
            <input
              required
              className={inputCls}
              value={editForm.code}
              onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
            />
          </Field>
          <Field label="Store Name">
            <input
              required
              className={inputCls}
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </Field>
          <Field label="Store Type">
            <select
              className={inputCls}
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            >
              <option value="Main Store">Main Store</option>
              <option value="Department Store">Department Store</option>
              <option value="Cafeteria Store">Cafeteria Store</option>
            </select>
          </Field>
          <Field label="Designated Store Head">
            <select
              className={inputCls}
              value={editForm.headUserId}
              onChange={(e) => setEditForm({ ...editForm, headUserId: e.target.value })}
            >
              <option value="">-- None Assigned --</option>
              {storeHeadCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
