import React from "react";

export default function AreaLineChart({
  title = "System Activity",
  data = [35, 48, 42, 60, 52, 78, 65, 88, 72, 95],
  labels = ["May 10", "May 17", "May 24", "May 31", "Jun 7"],
  color = "#8b5cf6",
  fillColor = "rgba(139, 92, 246, 0.12)",
  unit = "",
  className = "",
}) {
  const maxVal = Math.max(...data, 100);
  const minVal = Math.min(...data, 0);
  const width = 500;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((val - minVal) / (maxVal - minVal || 1)) * (height - paddingY * 2);
    return { x, y, val };
  });

  // Generate smooth SVG curve using Catmull-Rom or cubic Bezier
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className="text-[11px] font-medium text-slate-400">
          Last 30 Days
        </span>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full overflow-visible"
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path
            d={areaD}
            fill={`url(#grad-${title.replace(/\s+/g, "")})`}
          />

          {/* Curve line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Vertex dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#ffffff"
              stroke={color}
              strokeWidth="2"
              className="transition-transform hover:scale-150"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="mt-1 flex items-center justify-between px-2 text-[10px] font-medium text-slate-400">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
