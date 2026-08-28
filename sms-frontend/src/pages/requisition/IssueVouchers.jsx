import React, { useState } from "react";
import { PackageCheck, Pencil, ShieldAlert } from "lucide-react";
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

export default function IssueVouchers() {
  const {
    issueVouchers,
    finalizeVoucher,
    recordGateClearance,
    amendVoucher,
    approveVoucher,
    currentUser,
  } = useApp();
  const canFinalize = currentUser?.role === "Store Head";
  const canAmend = [
    "Property Administration Officer",
    "Department Head",
  ].includes(currentUser?.role);
  const canApprove = [
    "Property Administration Officer",
    "Department Head",
  ].includes(currentUser?.role);
  const canClearGate = currentUser?.role === "Campus Security Officer";

  const [amendTarget, setAmendTarget] = useState(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  function openAmend(voucher) {
    setAmendTarget(voucher);
    setQty(voucher.qty);
  }

  async function submitAmend(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await amendVoucher(amendTarget.id, Number(qty));
    setSaving(false);
    if (ok) setAmendTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Store / Inter-Store Issue Vouchers (SIV / ISIV)"
        description="Preliminary vouchers (Model 20) can be amended and approved, then finalized into the official issue voucher (Model 22), which deducts stock automatically."
      />

      <DataTable
        searchKeys={["refNo", "requisitionRef"]}
        columns={[
          { key: "refNo", header: "Voucher No." },
          {
            key: "requisitionRef",
            header: "Requisition Ref.",
            render: (r) => r.requisitionRef || "—",
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
          { key: "model", header: "Form" },
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
            render: (r) =>
              r.status === "Preliminary" ||
              r.status === "Approved" ||
              r.status === "Issued" ? (
                <div className="flex gap-2">
                  {r.status === "Preliminary" && canAmend && (
                    <button
                      onClick={() => openAmend(r)}
                      className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                    >
                      <Pencil size={12} /> Amend
                    </button>
                  )}
                  {r.status === "Preliminary" && canApprove && (
                    <>
                      <button
                        onClick={() => approveVoucher(r.id, "Approved")}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Approve Model 20
                      </button>
                      <button
                        onClick={() => approveVoucher(r.id, "Rejected")}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {r.status === "Approved" && canFinalize && (
                    <button
                      onClick={() => finalizeVoucher(r.id)}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                    >
                      <PackageCheck size={12} /> Issue Model 22
                    </button>
                  )}
                  {r.status === "Issued" &&
                    canClearGate &&
                    (r.gateClearance ? (
                      <span className="text-xs font-medium text-emerald-700">
                        Cleared
                      </span>
                    ) : (
                      <button
                        onClick={() => recordGateClearance(r.id)}
                        className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                      >
                        <ShieldAlert size={12} /> Record Gate Clearance
                      </button>
                    ))}
                </div>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              ),
          },
        ]}
        rows={issueVouchers}
      />

      <Modal
        open={!!amendTarget}
        onClose={() => setAmendTarget(null)}
        title={`Amend Voucher — ${amendTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAmendTarget(null)}>
              Cancel
            </Button>
            <Button form="amend-form" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Amendment"}
            </Button>
          </>
        }
      >
        <form id="amend-form" onSubmit={submitAmend}>
          <Field label="Amended Quantity">
            <input
              type="number"
              min="1"
              required
              className={inputCls}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
          <p className="text-xs text-slate-400">
            Only a Preliminary Model 20 voucher can be amended, before approval.
          </p>
        </form>
      </Modal>
    </div>
  );
}
