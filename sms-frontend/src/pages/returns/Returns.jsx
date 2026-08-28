import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
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

export default function Returns() {
  const {
    returns,
    issueVouchers,
    items,
    addReturn,
    evaluateReturn,
    decideReturn,
    currentUser,
  } = useApp();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [evalTarget, setEvalTarget] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const issuedVouchers = issueVouchers.filter(
    (voucher) => voucher.status === "Issued",
  );
  const [form, setForm] = useState({
    itemId: "",
    sourceIssueVoucherId: "",
    qty: 1,
    reason: "",
  });

  const isTEC = ["Technical Evaluation Committee"].includes(currentUser?.role);
  const canRequest = ["Department Head", "Requesting Staff"].includes(
    currentUser?.role,
  );
  const canApproveDepartment = currentUser?.role === "Department Head";
  const canDecide = ["Property Administration Officer", "Store Head"].includes(
    currentUser?.role,
  );

  useEffect(() => {
    if (view === "submit" && canRequest) setOpen(true);
  }, [view, canRequest]);

  const visibleReturns =
    view === "staff-approvals"
      ? returns.filter(
          (entry) =>
            entry.status === "Pending Department Approval" &&
            (!currentUser?.department ||
              entry.department?.toLowerCase() ===
                currentUser.department.toLowerCase()),
        )
      : returns;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await addReturn({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ itemId: "", sourceIssueVoucherId: "", qty: 1, reason: "" });
      setOpen(false);
    }
  }

  async function submitEvaluation(condition) {
    const { ok } = await evaluateReturn(evalTarget.id, condition, remarks);
    if (ok) {
      setEvalTarget(null);
      setRemarks("");
    }
  }

  return (
    <div>
      <PageHeader
        title="Material Return (Store Return Note — SRN)"
        description="Materials returned to store are technically evaluated before being reinstated to stock or referred for disposal."
        action={
          canRequest && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> New Return Request
            </Button>
          )
        }
      />

      <DataTable
        searchKeys={["refNo", "returnedByName", "reason"]}
        columns={[
          { key: "refNo", header: "SRN No." },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          { key: "qty", header: "Qty" },
          {
            key: "returnedByName",
            header: "Returned By",
            render: (r) => r.returnedByName || "—",
          },
          { key: "reason", header: "Reason" },
          {
            key: "condition",
            header: "Condition",
            render: (r) => r.condition || "—",
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
                {r.status === "Pending Technical Evaluation" && isTEC && (
                  <button
                    onClick={() => setEvalTarget(r)}
                    className="text-xs font-medium text-navy-700 hover:underline"
                  >
                    Record Evaluation
                  </button>
                )}
                {r.status === "Pending Department Approval" &&
                  canApproveDepartment && (
                    <>
                      <button
                        onClick={() => decideReturn(r.id, "Approved")}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Department Approve
                      </button>
                      <button
                        onClick={() => decideReturn(r.id, "Rejected")}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                {r.status === "Evaluated" && canDecide && (
                  <>
                    <button
                      onClick={() => decideReturn(r.id, "Approved")}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decideReturn(r.id, "Rejected")}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        rows={visibleReturns}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Material Return Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="ret-form" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Return"}
            </Button>
          </>
        }
      >
        <form id="ret-form" onSubmit={submit}>
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
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source Model 22 Issue Voucher">
            <select
              required
              className={inputCls}
              value={form.sourceIssueVoucherId}
              onChange={(e) => {
                const voucher = issuedVouchers.find(
                  (entry) => entry.id === e.target.value,
                );
                setForm({
                  ...form,
                  sourceIssueVoucherId: e.target.value,
                  itemId: voucher?.itemId || "",
                });
              }}
            >
              <option value="">Select the finalized issue voucher…</option>
              {issuedVouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.refNo} — {voucher.itemName} — issued qty{" "}
                  {voucher.qty}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                className={inputCls}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Reason for Return">
            <textarea
              rows={3}
              required
              className={inputCls}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!evalTarget}
        onClose={() => setEvalTarget(null)}
        title={`Technical Evaluation — ${evalTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEvalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => submitEvaluation("Damaged")}
            >
              <XCircle size={14} /> Damaged
            </Button>
            <Button onClick={() => submitEvaluation("Serviceable")}>
              <CheckCircle2 size={14} /> Serviceable
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Record the physical condition of the returned material after
          inspection.
        </p>
        <Field label="Remarks">
          <textarea
            rows={2}
            className={inputCls}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Field>
      </Modal>
    </div>
  );
}
