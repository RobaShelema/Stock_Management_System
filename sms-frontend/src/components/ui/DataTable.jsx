import React, { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";

export default function DataTable({
  columns,
  rows,
  searchKeys = [],
  emptyLabel = "No records found.",
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, q, searchKeys]);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
      {searchKeys.length > 0 && (
        <div className="flex items-center gap-2 border-b border-navy-50 px-4 py-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="focus-ring w-full max-w-xs rounded-md border-0 bg-transparent text-sm placeholder:text-slate-400 focus:ring-0"
          />
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-50 bg-navy-50/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={22} className="text-slate-300" />
                    {emptyLabel}
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.id ?? i}
                className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="whitespace-nowrap px-4 py-2.5 text-slate-700"
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
