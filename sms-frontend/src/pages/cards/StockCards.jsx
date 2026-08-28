import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import api from "../../lib/api.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";

export default function StockCards() {
  const { items, showToast } = useApp();
  const [selected, setSelected] = useState("");
  const [q, setQ] = useState("");
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length > 0 && !selected) setSelected(items[0].id);
  }, [items, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.stockCards
      .get(selected)
      .then(setCard)
      .catch((err) => showToast(err.message, "warn"))
      .finally(() => setLoading(false));
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()) || i.code.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  return (
    <div>
      <PageHeader title="Stock Record Cards" description="Auto-maintained running balance and full transaction history per material, with FIFO cost impact." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <Search size={15} className="text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search item…" className="focus-ring w-full border-0 bg-transparent text-sm focus:ring-0" />
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {filteredItems.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i.id)}
                className={`block w-full border-b border-slate-50 px-3 py-2.5 text-left text-sm last:border-0 ${
                  selected === i.id ? "bg-navy-50 text-navy-800 font-medium" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <p>{i.name}</p>
                <p className="text-xs text-slate-400">{i.code} · {i.qtyOnHand} {i.unit} on hand</p>
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
                  <h3 className="text-base font-semibold text-slate-800">{card.item.name}</h3>
                  <p className="text-xs text-slate-400">{card.item.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-navy-800">{card.item.qtyOnHand}</p>
                  <p className="text-xs text-slate-400">{card.item.unit} on hand</p>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                    <th className="py-2">Date</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Reference</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Cost Impact</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {card.entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-400">No transactions recorded yet.</td>
                    </tr>
                  )}
                  {card.entries.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Badge tone={Number(t.qty) > 0 ? "green" : "amber"}>{t.type}</Badge>
                      </td>
                      <td className="py-2 text-slate-500">{t.reference}</td>
                      <td className={`py-2 text-right font-medium ${Number(t.qty) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {Number(t.qty) > 0 ? `+${t.qty}` : t.qty}
                      </td>
                      <td className="py-2 text-right text-slate-500">
                        {t.costAmount !== null ? `ETB ${Number(t.costAmount).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-700">{t.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            !loading && <p className="text-sm text-slate-400">Select an item to view its stock card.</p>
          )}
        </div>
      </div>
    </div>
  );
}
