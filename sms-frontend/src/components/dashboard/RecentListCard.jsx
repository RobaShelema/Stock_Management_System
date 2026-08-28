import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function RecentListCard({
  title = "Recent Activities",
  items = [],
  viewAllLink = "/audit-log",
  viewAllText = "View All",
  emptyText = "No recent records.",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <span className="text-[11px] font-medium text-slate-400">
            {items.length} items
          </span>
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">{emptyText}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.slice(0, 5).map((item, idx) => {
              const ItemIcon = item.icon || Clock;
              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between py-2.5 text-xs transition-colors hover:bg-slate-50/50 rounded-lg px-1.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        item.iconBg || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ItemIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate leading-tight">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.time && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.time}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          item.badgeTone === "green"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.badgeTone === "red"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : item.badgeTone === "amber"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.action && (
                      <div>{item.action}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewAllLink && (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <span>{viewAllText}</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
