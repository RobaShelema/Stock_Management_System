import React from "react";

const TONE_MAP = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
  navy: "bg-navy-50 text-navy-700 ring-navy-600/20",
};

const STATUS_TONE = {
  "Awaiting Evaluation": "amber",
  Approved: "green",
  Rejected: "red",
  "GRN Generated": "blue",
  "Pending Approval": "amber",
  "Pending Department Approval": "amber",
  "Pending PAO Approval": "clay",
  "Pending Technical Evaluation": "amber",
  Evaluated: "blue",
  Issued: "green",
  Preliminary: "amber",
  "Pending Disposal": "amber",
  Disposed: "slate",
  Active: "green",
  Inactive: "slate",
  "In Use": "blue",
  Serviceable: "green",
  Damaged: "red",
  Obsolete: "slate",
};

export default function Badge({ children, tone }) {
  const resolvedTone = tone || STATUS_TONE[children] || "slate";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_MAP[resolvedTone]}`}
    >
      {children}
    </span>
  );
}
