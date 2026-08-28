import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Shield,
  UserCheck,
  UserX,
  ShieldAlert,
  KeyRound,
  Info,
} from "lucide-react";
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

const ROLES = [
  {
    name: "Administrator",
    directorate: "ICT Directorate",
    scope:
      "Owns system configuration, accounts, technical integrity, backups, audit review, and delegated supplier setup. Does not participate in material approvals.",
  },
  {
    name: "Property Administration Officer",
    directorate: "Property Administration",
    scope:
      "Senior gatekeeper: final approval on requisitions, material returns, and inter-store transfers.",
  },
  {
    name: "Store Head",
    directorate: "Store Management",
    scope:
      "First-line store manager: records incoming shipments, creates preliminary vouchers, and finalizes stock issues.",
  },
  {
    name: "Stock Clerk",
    directorate: "Store Operations",
    scope:
      "Maintains bin-level physical stock, issues bin cards, and carries out physical counts.",
  },
  {
    name: "Technical Evaluation Committee",
    directorate: "Technical Assessment",
    scope:
      "Inspects incoming goods against PO specifications and evaluates returned goods.",
  },
  {
    name: "Property Registration Officer",
    directorate: "Asset Control",
    scope:
      "Generates Goods Receiving Notes (GRN) and registers newly acquired fixed assets.",
  },
  {
    name: "Department Head",
    directorate: "Academic / Administrative Depts",
    scope:
      "Submits and signs department store requisitions and return requests.",
  },
  {
    name: "Requesting Staff",
    description:
      "Submit requisitions and material returns for Department Head approval.",
  },
  {
    name: "Accountant",
    directorate: "Finance Directorate",
    scope:
      "Reviews valuation reports, stock ledger reconciliations, and financial audits.",
  },
  {
    name: "Disposal Committee",
    directorate: "Disposal Board",
    scope:
      "Reviews and decides on disposal requests for obsolete/damaged items.",
  },
  {
    name: "Campus Security Officer",
    directorate: "Campus Security",
    scope:
      "Verifies gate passes and approved issue vouchers for materials exiting stores.",
  },
];

export default function Users() {
  const { users, stores, addUser, updateUser, toggleUserStatus, currentUser } =
    useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    role: ROLES[0].name,
    email: "",
    password: "",
    storeId: "",
    department: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    role: ROLES[0].name,
    email: "",
    password: "",
    storeId: "",
    department: "",
  });

  const isAdmin = currentUser?.role === "Administrator";

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addUser(createForm);
    setSaving(false);
    if (ok) {
      setCreateForm({
        name: "",
        role: ROLES[0].name,
        email: "",
        password: "",
        storeId: "",
        department: "",
      });
      setCreateOpen(false);
    }
  }

  function startEdit(user) {
    setEditForm({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      password: "",
      storeId: user.storeId || "",
      department: user.department || "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await updateUser(editForm.id, {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      password: editForm.password || undefined,
      storeId: editForm.storeId || null,
      department: editForm.department || null,
    });
    setSaving(false);
    if (ok) {
      setEditOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="User Accounts & Role Permissions"
        description="Create, configure, and assign roles for all institutional actors. To preserve historical audit trails and transactional integrity, accounts are deactivated rather than deleted."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRoleInfo(!showRoleInfo)}
            >
              <Info size={16} /> Role Dictionary
            </Button>
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> New User Account
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/60 p-4 text-sm text-navy-800">
        <Shield size={18} className="mt-0.5 shrink-0 text-navy-600" />
        <div>
          <p className="font-medium text-navy-900">
            System Administrator (ICT Directorate) Access Control
          </p>
          <p className="mt-0.5 text-xs text-navy-700">
            You hold exclusive authorization to register accounts, assign
            operational permissions, update profiles, and deactivate accounts.
            Under University compliance rules, hard deletion is permanently
            disabled.
          </p>
        </div>
      </div>

      {showRoleInfo && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={16} className="text-clay-600" />
            Institutional Role & Permission Dictionary
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <div
                key={r.name}
                className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">{r.name}</p>
                  <Badge tone="navy">{r.directorate}</Badge>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {r.scope}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        searchKeys={["name", "role", "email"]}
        columns={[
          {
            key: "name",
            header: "User Full Name",
            render: (r) => (
              <div>
                <p className="font-semibold text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-400">{r.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Assigned Role",
            render: (r) => (
              <span className="inline-flex items-center gap-1.5 font-medium text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                <KeyRound size={12} className="text-clay-600" />
                {r.role}
              </span>
            ),
          },
          {
            key: "status",
            header: "Account Status",
            render: (r) => (
              <Badge
                tone={r.status === "Active" || !r.status ? "green" : "red"}
              >
                {r.status || "Active"}
              </Badge>
            ),
          },
          {
            key: "createdAt",
            header: "Created On",
            render: (r) =>
              r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) =>
              isAdmin ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(r)}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
                    title="Edit user details and role"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => toggleUserStatus(r.id)}
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
        rows={users}
      />

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New User Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-user-form" type="submit" disabled={saving}>
              {saving ? "Registering…" : "Register User"}
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate}>
          <Field label="Full Name">
            <input
              required
              className={inputCls}
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="e.g. Dr. Almaz Gebre"
            />
          </Field>
          <Field label="Institutional Role & Permission Group">
            <select
              className={inputCls}
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value })
              }
            >
              {ROLES.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.directorate})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              required
              className={inputCls}
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="e.g. almaz.gebre@university.edu"
            />
          </Field>
          <Field label="Assigned Store (optional)">
            <select
              className={inputCls}
              value={createForm.storeId}
              onChange={(e) =>
                setCreateForm({ ...createForm, storeId: e.target.value })
              }
            >
              <option value="">No store scope</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Department (optional)">
            <input
              className={inputCls}
              value={createForm.department}
              onChange={(e) =>
                setCreateForm({ ...createForm, department: e.target.value })
              }
              placeholder="e.g. Finance Department"
            />
          </Field>
          <Field label="Initial Password (Optional)">
            <input
              type="text"
              className={inputCls}
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              placeholder="Default is set to: Demo@1234"
            />
          </Field>
          <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
            Account will be created as <strong>Active</strong>. User permissions
            map directly to their assigned role.
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User Account & Role"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button form="edit-user-form" type="submit" disabled={saving}>
              {saving ? "Saving Changes…" : "Update Account"}
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleEdit}>
          <Field label="Full Name">
            <input
              required
              className={inputCls}
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </Field>
          <Field label="Assigned Role & Permissions">
            <select
              className={inputCls}
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
            >
              {ROLES.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.directorate})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              required
              className={inputCls}
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
          </Field>
          <Field label="Assigned Store (optional)">
            <select
              className={inputCls}
              value={editForm.storeId}
              onChange={(e) =>
                setEditForm({ ...editForm, storeId: e.target.value })
              }
            >
              <option value="">No store scope</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Department (optional)">
            <input
              className={inputCls}
              value={editForm.department}
              onChange={(e) =>
                setEditForm({ ...editForm, department: e.target.value })
              }
              placeholder="e.g. Finance Department"
            />
          </Field>
          <Field label="Reset Password (Optional)">
            <input
              type="text"
              className={inputCls}
              value={editForm.password}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value })
              }
              placeholder="Leave blank to retain existing password"
            />
          </Field>
          <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-100">
            Changing a user's role will immediately update their dashboard
            permissions and sidebar access upon next refresh.
          </div>
        </form>
      </Modal>
    </div>
  );
}
