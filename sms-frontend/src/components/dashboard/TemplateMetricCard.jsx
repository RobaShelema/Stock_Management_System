import React from "react";

export default function TemplateMetricCard({
  label,
  value,
  sub,
  badge,
  badgeTone = "neutral",
  icon: Icon,
  className = "",
}) {
  const toneStyles = {
    green: "text-emerald-600 bg-emerald-50 border-emerald-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-rose-600 bg-rose-50 border-rose-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    teal: "text-teal-600 bg-teal-50 border-teal-100",
    neutral: "text-slate-500 bg-slate-50 border-slate-100",
  };

  const textToneStyles = {
    green: "text-emerald-600",
    emerald: "text-emerald-600",
    red: "text-rose-600",
    rose: "text-rose-600",
    amber: "text-amber-600",
    orange: "text-orange-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    teal: "text-teal-600",
    neutral: "text-slate-400",
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <Icon size={15} />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </h3>
      </div>

      {(badge || sub) && (
        <div className="mt-2 flex items-center gap-1.5">
          {badge ? (
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${
                toneStyles[badgeTone] || toneStyles.neutral
              }`}
            >
              {badge}
            </span>
          ) : (
            <p
              className={`text-[11px] font-medium ${
                textToneStyles[badgeTone] || textToneStyles.neutral
              }`}
            >
              {sub}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
