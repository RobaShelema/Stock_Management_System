import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
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

const METHODS = ["Auction", "Destruction", "Donation", "Write-off"];

export default function Disposal() {
  const {
    disposals,
    items,
    flagForDisposal,
    forwardDisposal,
    decideDisposal,
    currentUser,
    recordFinancialWriteOff,
  } = useApp();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [decideTarget, setDecideTarget] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", qty: 1, reason: "" });

  const isPAO = currentUser?.role === "Property Administration Officer";
  const isCommittee = currentUser?.role === "Disposal Committee";
  const isAccountant = currentUser?.role === "Accountant";
  const [writeOffTarget, setWriteOffTarget] = useState(null);
  const [writeOffAmount, setWriteOffAmount] = useState("");
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const canFlag = ["Store Head", "Technical Evaluation Committee"].includes(
    currentUser?.role,
  );
  const displayedDisposals =
    view === "pending"
      ? disposals.filter((r) => r.status === "Forwarded to Committee")
      : view === "history"
        ? disposals.filter((r) => ["Disposed", "Rejected"].includes(r.status))
        : disposals;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await flagForDisposal({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ itemId: "", qty: 1, reason: "" });
      setOpen(false);
    }
  }

  async function submitForward(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await forwardDisposal(forwardTarget.id, reviewNotes);
    setSaving(false);
    if (ok) {
      setForwardTarget(null);
      setReviewNotes("");
    }
  }

  async function submitDecision(decision) {
    const { ok } = await decideDisposal(
      decideTarget.id,
      decision,
      decision === "Approved" ? method : undefined,
    );
    if (ok) setDecideTarget(null);
  }

  async function submitWriteOff(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await recordFinancialWriteOff(
      writeOffTarget.id,
      Number(writeOffAmount),
      writeOffNotes,
    );
    setSaving(false);
    if (ok) {
      setWriteOffTarget(null);
      setWriteOffAmount("");
      setWriteOffNotes("");
    }
  }

  return (
    <div>
      <PageHeader
        title="Disposal Workflow &amp; Obsolescence Review"
        description="Review, endorse, and manage the university-wide disposal chain for obsolete, damaged, or unserviceable property."
        action={
          canFlag && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Flag Item for Disposal
            </Button>
          )
        }
      />

      {isPAO && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-navy-100 bg-navy-50/70 p-3.5 text-xs text-navy-800">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy-700" />
          <div>
            <p className="font-semibold text-navy-900">
              PAO Review &amp; Endorsement Gateway
            </p>
            <p className="mt-0.5 text-navy-700">
              As Property Administration Officer, review incoming disposal
              requests flagged by stores/TEC, assess salvageability, and forward
              endorsed dossiers to the Disposal Committee for final write-off or
              auction authorization.
            </p>
          </div>
        </div>
      )}

      {isCommittee && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-clay-200 bg-clay-50/80 p-3.5 text-xs text-clay-900">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-clay-700" />
          <div>
            <p className="font-semibold text-clay-900">
              Disposal Authorization Board
            </p>
            <p className="mt-0.5 text-clay-800">
              As the Disposal Committee, you hold institutional authority to
              authorize or reject permanent property retirement. Select a
              disposal method (Auction, Destruction, Donation, Write-off) to
              permanently relieve stock.
            </p>
          </div>
        </div>
      )}

      <DataTable
        searchKeys={["refNo", "reason", "itemName"]}
        columns={[
          {
            key: "refNo",
            header: "Ref. No.",
            render: (r) => (
              <span className="font-mono font-bold text-navy-900">
                {r.refNo}
              </span>
            ),
          },
          {
            key: "itemName",
            header: "Material",
            render: (r) => r.itemName || "—",
          },
          { key: "qty", header: "Qty" },
          { key: "reason", header: "Justification & Reason" },
          {
            key: "method",
            header: "Disposal Method",
            render: (r) =>
              r.method || (
                <span className="text-slate-400 italic">Pending Committee</span>
              ),
          },
          {
            key: "createdAt",
            header: "Date",
            render: (r) => new Date(r.createdAt).toLocaleDateString(),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge
                tone={
                  r.status === "Disposed"
                    ? "green"
                    : r.status === "Pending Disposal"
                      ? "amber"
                      : "clay"
                }
              >
                {r.status}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="flex items-center gap-2">
                {r.status === "Pending Disposal" && isPAO && (
                  <button
                    onClick={() => {
                      setForwardTarget(r);
                      setReviewNotes("");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline bg-navy-50 px-2 py-1 rounded"
                  >
                    <Send size={12} /> Review &amp; Forward
                  </button>
                )}
                {["Pending Disposal", "Forwarded to Committee"].includes(
                  r.status,
                ) &&
                  isCommittee && (
                    <button
                      onClick={() => setDecideTarget(r)}
                      className="text-xs font-semibold text-clay-700 hover:text-clay-900 hover:underline bg-clay-50 px-2 py-1 rounded"
                    >
                      Committee Decision
                    </button>
                  )}
                {isAccountant &&
                  r.status === "Disposed" &&
                  !r.financialWriteOffAt && (
                    <button
                      onClick={() => {
                        setWriteOffTarget(r);
                        setWriteOffAmount("");
                        setWriteOffNotes("");
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline bg-emerald-50 px-2 py-1 rounded"
                    >
                      Record Financial Write-Off
                    </button>
                  )}
              </div>
            ),
          },
        ]}
        rows={displayedDisposals}
      />

      {/* Flag Item Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Flag Item for Disposal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="dp-form" type="submit" disabled={saving}>
              {saving ? "Flagging…" : "Submit for PAO Review"}
            </Button>
          </>
        }
      >
        <form id="dp-form" onSubmit={submit}>
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
                  {i.name} ({i.usableQty ?? i.qtyOnHand} {i.unit} usable)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity to Dispose">
            <input
              type="number"
              min="1"
              required
              className={inputCls}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </Field>
          <Field label="Reason & Condition (damage / expiry / obsolescence)">
            <textarea
              rows={3}
              required
              className={inputCls}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="State the technical justification for retirement or disposal..."
            />
          </Field>
        </form>
      </Modal>

      {/* PAO Review & Forward Modal */}
      <Modal
        open={!!forwardTarget}
        onClose={() => setForwardTarget(null)}
        title={`PAO Review & Forward — ${forwardTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForwardTarget(null)}>
              Cancel
            </Button>
            <Button form="forward-form" type="submit" disabled={saving}>
              <Send size={14} />{" "}
              {saving ? "Forwarding…" : "Endorse & Forward to Committee"}
            </Button>
          </>
        }
      >
        <form id="forward-form" onSubmit={submitForward} className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            <p>
              Material: <strong>{forwardTarget?.itemName}</strong>
            </p>
            <p>
              Quantity: <strong>{forwardTarget?.qty}</strong>
            </p>
            <p className="mt-1">
              Store Justification: <em>"{forwardTarget?.reason}"</em>
            </p>
          </div>

          <Field label="PAO Assessment Remarks & Recommendation">
            <textarea
              rows={3}
              className={inputCls}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g. Inspected on-site. Recommend Auction / Scrap destruction. Forwarded for board deliberation."
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!writeOffTarget}
        onClose={() => setWriteOffTarget(null)}
        title={`Record Financial Write-Off — ${writeOffTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWriteOffTarget(null)}>
              Cancel
            </Button>
            <Button form="write-off-form" type="submit" disabled={saving}>
              {saving ? "Recording…" : "Record Write-Off"}
            </Button>
          </>
        }
      >
        <form id="write-off-form" onSubmit={submitWriteOff}>
          <Field label="Financial Write-Off Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className={inputCls}
              value={writeOffAmount}
              onChange={(e) => setWriteOffAmount(e.target.value)}
            />
          </Field>
          <Field label="Finance Reference / Notes">
            <textarea
              rows={3}
              className={inputCls}
              value={writeOffNotes}
              onChange={(e) => setWriteOffNotes(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      {/* Disposal Committee Decision Modal */}
      <Modal
        open={!!decideTarget}
        onClose={() => setDecideTarget(null)}
        title={`Disposal Committee Decision — ${decideTarget?.refNo || ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecideTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => submitDecision("Rejected")}>
              Reject
            </Button>
            <Button onClick={() => submitDecision("Approved")}>
              Authorize Disposal
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <Field label="Authorized Disposal Method">
            <select
              className={inputCls}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-slate-400 mt-1">
            Authorizing disposal permanently relieves stock via FIFO consumption
            and sends notification for downstream write-off.
          </p>
        </div>
      </Modal>
    </div>
  );
}
