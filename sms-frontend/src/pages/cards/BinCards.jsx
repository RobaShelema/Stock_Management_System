import React, { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function BinCards() {
  const { binCards, items, stores, transferBetweenBins, showToast, currentUser } = useApp();
  const [selected, setSelected] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeId: "", itemId: "", fromBin: "", toBin: "", qty: 1 });

  const canTransfer = ["Store Head", "Stock Clerk", "Administrator"].includes(currentUser?.role);

  useEffect(() => {
    if (binCards.length > 0 && !selected) setSelected(binCards[0].id);
  }, [binCards, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.binCards
      .entries(selected)
      .then(setEntries)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = binCards.find((b) => b.id === selected);
  const balance = entries.length > 0 ? entries[0].balance : 0;

  async function submitTransfer(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await transferBetweenBins({ ...form, qty: Number(form.qty) });
    setSaving(false);
    if (ok) {
      setForm({ storeId: "", itemId: "", fromBin: "", toBin: "", qty: 1 });
      setOpen(false);
      if (selected) api.binCards.entries(selected).then(setEntries).catch(() => {});
    }
  }

  return (
    <div>
      <PageHeader
        title="Bin Cards"
        description="A bin card is generated automatically for each active storage bin, capturing every inbound/outbound movement and location balance."
        action={
          canTransfer && (
            <Button onClick={() => setOpen(true)}>
              <ArrowLeftRight size={16} /> Transfer Between Bins
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-1">
          <div className="max-h-[520px] overflow-y-auto">
            {binCards.length === 0 && <p className="p-4 text-sm text-slate-400">No bin cards yet.</p>}
            {binCards.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`block w-full border-b border-slate-50 px-3 py-2.5 text-left text-sm last:border-0 ${
                  selected === b.id ? "bg-navy-50 text-navy-800 font-medium" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <p>{b.bin} · {b.storeName}</p>
                <p className="text-xs text-slate-400">{b.itemName}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {!loading && card ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Bin {card.bin}</h3>
                  <p className="text-xs text-slate-400">{card.storeName} · {card.itemName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-navy-800">{balance}</p>
                  <p className="text-xs text-slate-400">current balance</p>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                    <th className="py-2">Date</th>
                    <th className="py-2">Direction</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-400">No movements recorded yet.</td>
                    </tr>
                  )}
                  {entries.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Badge tone={t.direction === "Inbound" ? "green" : "amber"}>{t.direction}</Badge>
                      </td>
                      <td className="py-2 text-slate-500">{t.reference}</td>
                      <td className={`py-2 text-right font-medium ${Number(t.qty) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-700">{t.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            !loading && <p className="text-sm text-slate-400">Select a bin to view its card.</p>
          )}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Transfer Stock Between Bins"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="bin-transfer-form" type="submit" disabled={saving}>{saving ? "Transferring…" : "Transfer"}</Button>
          </>
        }
      >
        <form id="bin-transfer-form" onSubmit={submitTransfer}>
          <Field label="Store">
            <select required className={inputCls} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Material">
            <select required className={inputCls} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
              <option value="">Select a material…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Bin">
              <input required className={inputCls} value={form.fromBin} onChange={(e) => setForm({ ...form, fromBin: e.target.value })} placeholder="e.g. BIN-A1" />
            </Field>
            <Field label="To Bin">
              <input required className={inputCls} value={form.toBin} onChange={(e) => setForm({ ...form, toBin: e.target.value })} placeholder="e.g. BIN-A2" />
            </Field>
          </div>
          <Field label="Quantity">
            <input type="number" min="1" required className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
