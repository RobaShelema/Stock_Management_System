import React from "react";
import {
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ActorHero({
  user,
  roleTitle,
  subtitle,
  actions,
  badgeText,
  storeOrDept,
}) {
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c182e] via-[#132746] to-[#1a3359] p-5 sm:p-7 text-white shadow-xl shadow-navy-950/20 border border-navy-700/50">
      {/* Decorative ambient background lights */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-clay-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        
        {/* Left Side: Avatar & Information */}
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-clay-600 via-clay-500 to-amber-500 text-base sm:text-lg font-bold text-white shadow-lg shadow-clay-950/30 ring-2 ring-white/20">
            {getInitials(user?.name)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-200 backdrop-blur-md border border-white/10">
                <ShieldCheck size={12} className="text-emerald-400" />
                {roleTitle || user?.role || "Authorized User"}
              </span>

              {storeOrDept && (
                <span className="inline-flex items-center gap-1 rounded-full bg-clay-500/20 px-2.5 py-0.5 text-[11px] font-medium text-clay-200 border border-clay-400/30">
                  <Building2 size={11} />
                  {storeOrDept}
                </span>
              )}

              {badgeText && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-400/30">
                  <Sparkles size={11} />
                  {badgeText}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              Welcome back, {user?.name || "Officer"}
            </h1>

            <p className="mt-0.5 text-xs sm:text-sm text-slate-300 line-clamp-1 max-w-2xl">
              {subtitle || "Stock & Property Management System — Live Operations & Approvals."}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons & Live Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-stretch lg:self-auto shrink-0 border-t border-white/10 pt-4 lg:border-0 lg:pt-0">
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}

          <div className="hidden xl:flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-white/10 text-[11px] text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Ledger Synced</span>
          </div>
        </div>

      </div>
    </div>
  );
}
