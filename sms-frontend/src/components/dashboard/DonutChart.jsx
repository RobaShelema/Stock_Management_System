import React from "react";

export default function DonutChart({
  title = "Stock Summary",
  total = 1285,
  totalLabel = "Total Items",
  segments = [
    { label: "Available", count: 1028, percentage: 79, color: "#10b981" },
    { label: "Issued", count: 157, percentage: 12, color: "#3b82f6" },
    { label: "Reserved", count: 68, percentage: 5, color: "#f59e0b" },
    { label: "Low Stock", count: 32, percentage: 4, color: "#ef4444" },
  ],
  className = "",
}) {
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative stroke dashes
  let cumulativePercentage = 0;
  const renderedSegments = segments.map((seg) => {
    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += seg.percentage;
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className="text-[11px] font-medium text-slate-400">Live Breakdown</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* SVG Donut Circle */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {renderedSegments.map((seg, idx) => (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
          </svg>

          {/* Central Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {typeof total === "number" ? total.toLocaleString() : total}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              {totalLabel}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="w-full max-w-[200px] space-y-2.5">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium text-slate-600 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800">
                  {seg.count?.toLocaleString() ?? 0}
                </span>{" "}
                <span className="text-[10px] text-slate-400">
                  ({seg.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
