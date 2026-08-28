import React from "react";

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "navy",
  icon: Icon,
  badge,
  onClick,
}) {
  const toneMap = {
    navy: "bg-gradient-to-br from-[#10203a] to-[#1d355d] text-white border border-navy-700/50 shadow-md shadow-navy-950/15",
    clay: "bg-gradient-to-br from-[#b85b30] to-[#c76f44] text-white border border-clay-400/40 shadow-md shadow-clay-950/15",
    emerald: "bg-gradient-to-br from-emerald-800 to-emerald-600 text-white border border-emerald-500/40 shadow-md shadow-emerald-950/15",
    amber: "bg-gradient-to-br from-amber-700 to-amber-500 text-white border border-amber-400/40 shadow-md shadow-amber-950/15",
    indigo: "bg-gradient-to-br from-indigo-800 to-indigo-600 text-white border border-indigo-500/40 shadow-md shadow-indigo-950/15",
    purple: "bg-gradient-to-br from-purple-800 to-purple-600 text-white border border-purple-500/40 shadow-md shadow-purple-950/15",
    rose: "bg-gradient-to-br from-rose-800 to-rose-600 text-white border border-rose-500/40 shadow-md shadow-rose-950/15",
    light: "bg-white text-slate-800 border border-slate-200/90 shadow-sm hover:border-navy-200",
  };

  const isLight = tone === "light";

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        onClick ? "cursor-pointer" : ""
      } ${toneMap[tone] || toneMap.navy}`}
    >
      {/* Subtle decorative background circle */}
      <div
        className={`pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-10 blur-xl ${
          isLight ? "bg-navy-700" : "bg-white"
        }`}
      />

      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${
            isLight ? "text-slate-500" : "text-white/80"
          }`}
        >
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isLight
                  ? "bg-slate-100 text-slate-700"
                  : "bg-white/20 text-white backdrop-blur-sm"
              }`}
            >
              {badge}
            </span>
          )}
          {Icon && (
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                isLight
                  ? "bg-slate-100 text-slate-600"
                  : "bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/20"
              }`}
            >
              <Icon size={16} strokeWidth={2.2} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {value}
        </p>
        {sub && (
          <p
            className={`mt-1 text-xs font-medium line-clamp-1 ${
              isLight ? "text-slate-500" : "text-white/70"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-navy-800 text-white hover:bg-navy-700 active:scale-[0.98] shadow-sm shadow-navy-900/10",
    clay:
      "bg-gradient-to-r from-clay-600 to-clay-500 text-white hover:brightness-110 active:scale-[0.98] shadow-sm shadow-clay-900/15",
    emerald:
      "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-sm shadow-emerald-900/10",
    secondary:
      "bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98] shadow-sm shadow-rose-900/10",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]",
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "focus-ring w-full rounded-xl border border-slate-300/90 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:bg-white focus:border-clay-500";

