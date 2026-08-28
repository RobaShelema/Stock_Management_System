import React from "react";

export default function GroupedBarChart({
  title = "Goods Receipt Overview",
  categories = ["May 10", "May 17", "May 24", "May 31", "Jun 7"],
  series = [
    {
      name: "Received",
      color: "#93c5fd", // light blue
      data: [12, 18, 14, 16, 20],
    },
    {
      name: "Accepted",
      color: "#2563eb", // primary blue
      data: [10, 16, 12, 15, 19],
    },
  ],
  className = "",
}) {
  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 10);
  const chartHeight = 150;

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className="text-[11px] font-medium text-slate-400">Weekly Flow</span>
      </div>

      <div className="relative w-full">
        {/* Bars Container */}
        <div
          className="flex items-end justify-between gap-3 border-b border-slate-200 px-3 pb-1"
          style={{ height: `${chartHeight}px` }}
        >
          {categories.map((cat, catIdx) => {
            return (
              <div
                key={catIdx}
                className="flex flex-1 items-end justify-center gap-1.5 h-full"
              >
                {series.map((s, sIdx) => {
                  const val = s.data[catIdx] || 0;
                  const heightPercent = Math.max((val / maxVal) * 100, 6);
                  return (
                    <div
                      key={sIdx}
                      className="group relative w-3.5 sm:w-4 rounded-t-sm transition-all duration-300 hover:brightness-110"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: s.color,
                      }}
                    >
                      {/* Tooltip on hover */}
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 hidden rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-white group-hover:block z-10 whitespace-nowrap">
                        {s.name}: {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-2 flex items-center justify-between px-3 text-[10px] font-medium text-slate-400">
          {categories.map((cat, idx) => (
            <span key={idx} className="flex-1 text-center truncate">
              {cat}
            </span>
          ))}
        </div>

        {/* Bottom Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 border-t border-slate-100 pt-2 text-xs">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="font-medium text-slate-600 text-xs">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
