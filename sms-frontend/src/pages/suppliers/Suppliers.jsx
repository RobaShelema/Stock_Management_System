import React, { useState } from "react";
import { Plus, Edit2, Truck, UserCheck, UserX, Info } from "lucide-react";
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

export default function Suppliers() {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    toggleSupplierStatus,
    currentUser,
  } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    contact: "",
    phone: "",
    email: "",
  });

  const isAdmin = currentUser?.role === "Administrator";
  const canManage =
    isAdmin ||
    currentUser?.role === "Property Administration Officer" ||
    currentUser?.role === "Store Head";
  const canToggleStatus =
    isAdmin || currentUser?.role === "Property Administration Officer";

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addSupplier(createForm);
    setSaving(false);
    if (ok) {
      setCreateForm({ name: "", contact: "", phone: "", email: "" });
      setCreateOpen(false);
    }
  }

  function startEdit(sup) {
    setEditForm({
      id: sup.id,
      name: sup.name,
      contact: sup.contact || "",
      phone: sup.phone || "",
      email: sup.email || "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await updateSupplier(editForm.id, {
      name: editForm.name,
      contact: editForm.contact,
      phone: editForm.phone,
      email: editForm.email,
    });
    setSaving(false);
    if (ok) {
      setEditOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers &amp; Procurement Partners"
        description="Register and manage suppliers, contractors, and donors used for purchasing, contract matching, and goods receipt verification."
        action={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New Supplier / Donor
            </Button>
          )
        }
      />

      {isAdmin && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-navy-50 px-4 py-2.5 text-xs text-navy-800 ring-1 ring-navy-100">
          <Info size={15} className="text-navy-600 shrink-0" />
          <span>
            <strong>Procurement Delegation</strong>: System Administrator is
            authorized to register, edit, and deactivate suppliers on behalf of
            the Procurement Directorate.
          </span>
        </div>
      )}

      <DataTable
        searchKeys={["name", "contact", "email", "phone"]}
        columns={[
          {
            key: "name",
            header: "Supplier / Donor Name",
            render: (r) => (
              <div>
                <p className="font-semibold text-slate-900">{r.name}</p>
                {r.contact && (
                  <p className="text-xs text-slate-400">Contact: {r.contact}</p>
                )}
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone Number",
            render: (r) => r.phone || "—",
          },
          {
            key: "email",
            header: "Email Address",
            render: (r) => r.email || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge
                tone={r.status === "Active" || !r.status ? "green" : "red"}
              >
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
                  {canToggleStatus && (
                    <button
                      onClick={() => toggleSupplierStatus(r.id)}
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
                  )}
                </div>
              ) : null,
          },
        ]}
        rows={suppliers}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New Supplier / Donor"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-sup-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Supplier"}
            </Button>
          </>
        }
      >
        <form id="create-sup-form" onSubmit={handleCreate}>
          <Field label="Supplier / Donor Legal Name">
            <input
              required
              className={inputCls}
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="e.g. Ethio Telecom / University Supplies PLC"
            />
          </Field>
          <Field label="Contact Person">
            <input
              className={inputCls}
              value={createForm.contact}
              onChange={(e) =>
                setCreateForm({ ...createForm, contact: e.target.value })
              }
              placeholder="e.g. Ato Bekele Tadesse"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone Number">
              <input
                className={inputCls}
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
                placeholder="+251 911 000000"
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                className={inputCls}
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="supplier@org.et"
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Supplier Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button form="edit-sup-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update Supplier"}
            </Button>
          </>
        }
      >
        <form id="edit-sup-form" onSubmit={handleEdit}>
          <Field label="Supplier / Donor Legal Name">
            <input
              required
              className={inputCls}
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </Field>
          <Field label="Contact Person">
            <input
              className={inputCls}
              value={editForm.contact}
              onChange={(e) =>
                setEditForm({ ...editForm, contact: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone Number">
              <input
                className={inputCls}
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                className={inputCls}
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
