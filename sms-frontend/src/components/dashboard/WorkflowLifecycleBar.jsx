import React from "react";
import { Link } from "react-router-dom";
import {
  PackagePlus,
  FileSearch,
  FileCheck2,
  ClipboardList,
  CheckSquare,
  PackageCheck,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function WorkflowLifecycleBar({
  goodsReceipts = [],
  requisitions = [],
  issueVouchers = [],
  returns = [],
  currentUser,
}) {
  const pendingReceipts = goodsReceipts.filter(
    (g) => g.status === "Awaiting Evaluation",
  );
  const approvedReceipts = goodsReceipts.filter((g) => g.status === "Approved");
  const pendingRequisitions = requisitions.filter(
    (r) =>
      r.status === "Pending Department Approval" ||
      r.status === "Pending PAO Approval" ||
      r.status === "Pending Approval",
  );
  const preliminaryVouchers = issueVouchers.filter(
    (v) => v.status === "Preliminary",
  );
  const approvedVouchers = issueVouchers.filter((v) => v.status === "Approved");
  const pendingGateClearance = issueVouchers.filter(
    (v) => v.status === "Issued" && !v.gateClearance,
  );
  const pendingReturns = returns.filter(
    (r) => r.status === "Pending Technical Evaluation",
  );

  const steps = [
    {
      id: "receipt",
      name: "1. Goods Receipt",
      desc: "Delivery arrival",
      count: pendingReceipts.length,
      countLabel: "Awaiting Inspection",
      link: "/goods-receipt",
      icon: PackagePlus,
      activeColor: "from-blue-600 to-indigo-600 text-white",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      roles: ["Store Head", "Stock Clerk"],
    },
    {
      id: "tec",
      name: "2. TEC Inspection",
      desc: "Quality & condition",
      count: pendingReceipts.length + pendingReturns.length,
      countLabel: "Pending Review",
      link: "/goods-receipt",
      icon: FileSearch,
      activeColor: "from-amber-600 to-amber-500 text-white",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      roles: ["Technical Evaluation Committee"],
    },
    {
      id: "grn",
      name: "3. Model 19 (GRN)",
      desc: "Post stock ledger",
      count: approvedReceipts.length,
      countLabel: "Ready for GRN",
      link: "/goods-receipt",
      icon: FileCheck2,
      activeColor: "from-cyan-600 to-cyan-500 text-white",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      roles: ["Property Registration Officer"],
    },
    {
      id: "req",
      name: "4. Store Requisition",
      desc: "Dept & PAO approval",
      count: pendingRequisitions.length,
      countLabel: "Pending Approval",
      link: "/requisitions",
      icon: ClipboardList,
      activeColor: "from-purple-600 to-purple-500 text-white",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      roles: ["Department Head", "Property Administration Officer", "Requesting Staff"],
    },
    {
      id: "m20",
      name: "5. Model 20 (SIV)",
      desc: "Review & amend",
      count: preliminaryVouchers.length,
      countLabel: "Preliminary",
      link: "/issue-vouchers",
      icon: CheckSquare,
      activeColor: "from-indigo-600 to-indigo-500 text-white",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      roles: ["Store Head", "Property Administration Officer"],
    },
    {
      id: "m22",
      name: "6. Model 22 (Issue)",
      desc: "FIFO deduction",
      count: approvedVouchers.length,
      countLabel: "Ready to Issue",
      link: "/issue-vouchers",
      icon: PackageCheck,
      activeColor: "from-emerald-600 to-emerald-500 text-white",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      roles: ["Store Head"],
    },
    {
      id: "gate",
      name: "7. Gate Clearance",
      desc: "Security gate pass",
      count: pendingGateClearance.length,
      countLabel: "Exit Queue",
      link: "/issue-vouchers",
      icon: ShieldCheck,
      activeColor: "from-orange-600 to-orange-500 text-white",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      roles: ["Campus Security Officer"],
    },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-navy-100/80 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-100 text-navy-800">
            <Sparkles size={13} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950">
            MoFED Official Material Lifecycle Pipeline
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">
          Click any stage to inspect active records
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((step, idx) => {
          const isUserDomain = step.roles.includes(currentUser?.role);
          const hasPending = step.count > 0;

          return (
            <Link
              key={step.id}
              to={step.link}
              className={`group relative flex flex-col justify-between rounded-xl border p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                isUserDomain
                  ? "border-navy-300/80 bg-navy-50/40 ring-1 ring-navy-400/20"
                  : "border-slate-200/80 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    hasPending
                      ? `bg-gradient-to-br ${step.activeColor} shadow-sm`
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <step.icon size={14} />
                </div>
                {hasPending ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-clay-500" />
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">0</span>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-navy-700">
                  {step.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span
                  className={`font-semibold truncate ${
                    hasPending ? "text-clay-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {hasPending ? `${step.count} ${step.countLabel}` : "Clear"}
                </span>
                <ChevronRight
                  size={12}
                  className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
