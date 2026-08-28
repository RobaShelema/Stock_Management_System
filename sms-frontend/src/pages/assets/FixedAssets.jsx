import React, { useState } from "react";
import { Plus, UserCheck, ClipboardCheck } from "lucide-react";
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

export default function FixedAssets() {
  const {
    fixedAssets,
    userCards,
    items,
    addFixedAsset,
    reassignFixedAsset,
    verifyFixedAsset,
    currentUser,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fixedAssetItems = items.filter((i) => i.type === "Fixed Asset");
  const canRegister = [
    "Property Registration Officer",
    "Administrator",
  ].includes(currentUser?.role);
  const canReassign = canRegister;
  const canVerify = [
    "Property Registration Officer",
    "Department Head",
    "Administrator",
  ].includes(currentUser?.role);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionForm, setActionForm] = useState({
    custodianName: "",
    department: "",
    reason: "",
    verificationStatus: "Verified",
    remarks: "",
  });

  const [form, setForm] = useState({
    tag: "",
    itemId: "",
    custodianName: "",
    department: "",
    acquisitionDate: new Date().toISOString().slice(0, 10),
    value: 0,
  });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addFixedAsset({ ...form, value: Number(form.value) });
    setSaving(false);
    if (ok) {
      setForm({
        tag: "",
        itemId: "",
        custodianName: "",
        department: "",
        acquisitionDate: new Date().toISOString().slice(0, 10),
        value: 0,
      });
      setOpen(false);
    }
  }

  function openAction(asset, type) {
    setActionTarget(asset);
    setActionType(type);
    setActionForm({
      custodianName: asset.custodianName,
      department: asset.department,
      reason: "",
      verificationStatus: "Verified",
      remarks: "",
    });
  }

  async function submitAction(e) {
    e.preventDefault();
    const result =
      actionType === "reassign"
        ? await reassignFixedAsset(actionTarget.id, {
            custodianName: actionForm.custodianName,
            department: actionForm.department,
            reason: actionForm.reason,
          })
        : await verifyFixedAsset(actionTarget.id, {
            verificationStatus: actionForm.verificationStatus,
            remarks: actionForm.remarks,
          });
    if (result?.ok) {
      setActionTarget(null);
      setActionType(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fixed Asset Registration"
        description="Register fixed (non-consumable) assets with a unique tag, assign custody, and track depreciation status."
        action={
          canRegister && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Register Asset
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["tag", "custodianName", "department"]}
        columns={[
          { key: "tag", header: "Asset Tag" },
          {
            key: "itemName",
            header: "Description",
            render: (r) => r.itemName || "—",
          },
          { key: "custodianName", header: "Custodian" },
          { key: "department", header: "Department" },
          {
            key: "acquisitionDate",
            header: "Acquired",
            render: (r) => new Date(r.acquisitionDate).toLocaleDateString(),
          },
          {
            key: "value",
            header: "Value (ETB)",
            render: (r) => Number(r.value).toLocaleString(),
          },
          {
            key: "lastVerifiedAt",
            header: "Last Verified",
            render: (r) =>
              r.lastVerifiedAt
                ? new Date(r.lastVerifiedAt).toLocaleDateString()
                : "Never",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge>{r.status}</Badge>,
          },
          {
            key: "actions",
            header: "Action",
            render: (r) => (
              <div className="flex gap-2">
                {canReassign && r.status !== "Disposed" && (
                  <button
                    onClick={() => openAction(r, "reassign")}
                    className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                  >
                    <UserCheck size={12} /> Reassign
                  </button>
                )}
                {canVerify && r.status !== "Disposed" && (
                  <button
                    onClick={() => openAction(r, "verify")}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    <ClipboardCheck size={12} /> Verify
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={fixedAssets}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register Fixed Asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="fa-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Asset"}
            </Button>
          </>
        }
      >
        <form id="fa-form" onSubmit={submit}>
          <Field label="Asset Tag">
            <input
              required
              className={inputCls}
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="FA-2026-00xx"
            />
          </Field>
          <Field label="Item / Description">
            <select
              required
              className={inputCls}
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            >
              <option value="">Select an item…</option>
              {fixedAssetItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Custodian">
              <input
                required
                className={inputCls}
                value={form.custodianName}
                onChange={(e) =>
                  setForm({ ...form, custodianName: e.target.value })
                }
              />
            </Field>
            <Field label="Department">
              <input
                required
                className={inputCls}
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Acquisition Date">
              <input
                type="date"
                className={inputCls}
                value={form.acquisitionDate}
                onChange={(e) =>
                  setForm({ ...form, acquisitionDate: e.target.value })
                }
              />
            </Field>
            <Field label="Value (ETB)">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={
          actionType === "reassign"
            ? `Reassign Custody — ${actionTarget?.tag || ""}`
            : `Verify Asset — ${actionTarget?.tag || ""}`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionTarget(null)}>
              Cancel
            </Button>
            <Button form="asset-action-form" type="submit">
              Save
            </Button>
          </>
        }
      >
        <form id="asset-action-form" onSubmit={submitAction}>
          {actionType === "reassign" ? (
            <>
              <Field label="New Custodian">
                <input
                  required
                  className={inputCls}
                  value={actionForm.custodianName}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      custodianName: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="New Department">
                <input
                  required
                  className={inputCls}
                  value={actionForm.department}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, department: e.target.value })
                  }
                />
              </Field>
              <Field label="Reason">
                <textarea
                  required
                  rows={3}
                  className={inputCls}
                  value={actionForm.reason}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, reason: e.target.value })
                  }
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Verification Result">
                <select
                  className={inputCls}
                  value={actionForm.verificationStatus}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      verificationStatus: e.target.value,
                    })
                  }
                >
                  <option>Verified</option>
                  <option>Exception</option>
                </select>
              </Field>
              <Field label="Verification Remarks">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={actionForm.remarks}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, remarks: e.target.value })
                  }
                />
              </Field>
            </>
          )}
        </form>
      </Modal>

      <div className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          User-Cards (Custody by Individual)
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userCards.length === 0 && (
            <p className="text-sm text-slate-400">No custody records yet.</p>
          )}
          {userCards.map((uc) => (
            <div
              key={`${uc.custodianName}-${uc.department}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-800">
                {uc.custodianName}
              </p>
              <p className="mb-3 text-xs text-slate-400">{uc.department}</p>
              <div className="space-y-2">
                {uc.assets.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">
                      {items.find((i) => i.id === a.itemId)?.name || "—"}
                    </span>
                    <span className="text-xs text-slate-400">{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
