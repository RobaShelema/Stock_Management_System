import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ArrowRightCircle } from "lucide-react";
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

export default function Requisitions() {
  const {
    requisitions,
    items,
    stores,
    addRequisition,
    decideRequisition,
    createPreliminaryVoucher,
    currentUser,
  } = useApp();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    department: currentUser?.department || "",
    storeId: "",
    itemId: "",
    qty: 1,
  });

  useEffect(() => {
    if (currentUser?.department && !form.department) {
      setForm((previous) => ({
        ...previous,
        department: currentUser.department,
      }));
    }
  }, [currentUser?.department, form.department]);

  const canApproveDepartment = currentUser?.role === "Department Head";
  const canApprovePao = currentUser?.role === "Property Administration Officer";
  const canRequest = ["Department Head", "Requesting Staff"].includes(
    currentUser?.role,
  );
  const canIssuePrelim = ["Store Head"].includes(currentUser?.role);

  useEffect(() => {
    if (view === "submit" && canRequest) setOpen(true);
  }, [view, canRequest]);

  const visibleRequisitions =
    view === "staff-approvals"
      ? requisitions.filter(
          (requisition) =>
            ["Pending Department Approval", "Pending Approval"].includes(
              requisition.status,
            ) &&
            (!currentUser?.department ||
              requisition.department?.toLowerCase() ===
                currentUser.department.toLowerCase()),
        )
      : requisitions;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addRequisition({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({
        department: currentUser?.department || "",
        storeId: "",
        itemId: "",
        qty: 1,
      });
      setOpen(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Store Requisition (SR)"
        description="Submit and approve requests for materials from a department, routed for approval before issuing."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Requisition
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "department", "requestedByName"]}
        columns={[
          { key: "refNo", header: "Ref. No." },
          { key: "department", header: "Department" },
          {
            key: "requestedByName",
            header: "Requested By",
            render: (r) => r.requestedByName || "—",
          },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          {
            key: "storeName",
            header: "Store",
            render: (r) => r.storeName || "—",
          },
          { key: "qty", header: "Qty" },
          {
            key: "createdAt",
            header: "Date",
            render: (r) => new Date(r.createdAt).toLocaleDateString(),
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
                {(r.status === "Pending Department Approval" ||
                  (r.status === "Pending Approval" && canApproveDepartment)) &&
                  canApproveDepartment && (
                    <>
                      <button
                        onClick={() => decideRequisition(r.id, "Approved")}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Department Approve
                      </button>
                      <button
                        onClick={() => decideRequisition(r.id, "Rejected")}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                {r.status === "Pending PAO Approval" && canApprovePao && (
                  <>
                    <button
                      onClick={() => decideRequisition(r.id, "Approved")}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      PAO Approve
                    </button>
                    <button
                      onClick={() => decideRequisition(r.id, "Rejected")}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Reject
                    </button>
                  </>
                )}
                {r.status === "Approved" && canIssuePrelim && (
                  <button
                    onClick={() => createPreliminaryVoucher(r.id)}
                    className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                  >
                    <ArrowRightCircle size={12} /> Create SIV (Model 20)
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={visibleRequisitions}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Store Requisition"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="req-form" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Requisition"}
            </Button>
          </>
        }
      >
        <form id="req-form" onSubmit={submit}>
          <Field label="Requesting Department">
            <input
              required
              className={inputCls}
              value={form.department}
              readOnly={
                currentUser?.role === "Department Head" ||
                currentUser?.role === "Requesting Staff"
              }
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Finance Department"
            />
          </Field>
          <Field label="Issuing Store">
            <select
              required
              className={inputCls}
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Material">
            <select
              required
              className={inputCls}
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            >
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.qtyOnHand} {i.unit} available)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity Requested">
            <input
              type="number"
              min="1"
              required
              className={inputCls}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
