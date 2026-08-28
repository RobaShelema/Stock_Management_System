import React from "react";
import { User } from "lucide-react";

export default function DashboardRoleHeader({
  title = "Dashboard",
  subtitle = "Overview of system activities",
  user,
  roleTitle,
  department,
  actions,
}) {
  const displayName = user?.name || "Admin User";
  const displayRole = roleTitle || user?.role || "System Administrator";
  const displayDept = department || user?.department || "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {actions && <div className="mr-2 flex items-center gap-2">{actions}</div>}

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3.5 py-1.5 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold leading-tight text-slate-800">
              {displayName}
            </p>
            <p className="text-[10px] font-medium leading-tight text-slate-400">
              {displayDept ? `${displayRole} • ${displayDept}` : displayRole}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-bold text-xs text-white ring-2 ring-slate-100">
            {initials || <User size={14} />}
          </div>
        </div>
      </div>
    </div>
  );
}
