import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Tags,
  MapPin,
  PackageCheck,
  ClipboardList,
  ArrowLeftRight,
  Boxes,
  CreditCard,
  Undo2,
  Recycle,
  BarChart3,
  ShieldCheck,
  Users,
  Truck,
  Package,
  Scale,
  Settings,
  Activity,
  CheckSquare,
  FileCheck,
  FileCheck2,
  UserCheck,
  BookOpen,
  DollarSign,
  ShieldAlert,
  GanttChartSquare,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

// 1. System Administrator Navigation
const ADMIN_NAV = [
  {
    section: "Overview",
    items: [
      { to: "/", label: "System Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    section: "Accounts & Access",
    items: [{ to: "/users", label: "User Accounts & Roles", icon: Users }],
  },
  {
    section: "System Configuration",
    items: [
      { to: "/stores", label: "Stores Configuration", icon: Warehouse },
      { to: "/system-settings", label: "System Settings", icon: Settings },
    ],
  },
  {
    section: "Technical Integrity",
    items: [
      { to: "/audit-log", label: "Full Audit Log", icon: ShieldCheck },
      {
        to: "/system-health",
        label: "System Health & Backups",
        icon: Activity,
      },
    ],
  },
  {
    section: "Delegated Procurement",
    items: [{ to: "/suppliers", label: "Suppliers Management", icon: Truck }],
  },
];

// 2. Property Administration Officer (PAO) Navigation
const PAO_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Executive Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Senior Approvals & Workflows",
    items: [
      { to: "/requisitions", label: "Store Requisitions", icon: ClipboardList },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (Model 20/22)",
        icon: CheckSquare,
      },
      { to: "/returns", label: "Material Returns (SRN)", icon: Undo2 },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
      },
      { to: "/disposal", label: "Disposal Review & Forwarding", icon: Recycle },
    ],
  },
  {
    section: "University Stock & Assets",
    items: [
      { to: "/stock-cards", label: "Stock Cards (FIFO)", icon: Boxes },
      { to: "/bin-cards", label: "Bin Cards (All Stores)", icon: Package },
      {
        to: "/fixed-assets",
        label: "Fixed Assets & User Cards",
        icon: CreditCard,
      },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
      { to: "/stores", label: "Campus Store Units", icon: Warehouse },
      { to: "/locations", label: "Item Locations & Bins", icon: MapPin },
      {
        to: "/goods-receipt",
        label: "Goods Receipts & GRN",
        icon: PackageCheck,
      },
      { to: "/suppliers", label: "Suppliers & Donors", icon: Truck },
    ],
  },
  {
    section: "Stock Control & Governance",
    items: [
      {
        to: "/stock-control",
        label: "Stock Takes & Reconciliation",
        icon: Scale,
      },
      { to: "/reports", label: "Reports & Analytics Export", icon: BarChart3 },
      { to: "/audit-log", label: "Governance Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 3. Store Head Navigation (Central Store / College or Department Store / Cafeteria Store / ICT Store)
const STORE_HEAD_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Store Operations Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Receiving & Issuing",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipts (Record Delivery)",
        icon: PackageCheck,
      },
      {
        to: "/requisitions",
        label: "Approved Requisitions",
        icon: ClipboardList,
      },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (Model 20/22)",
        icon: CheckSquare,
      },
    ],
  },
  {
    section: "Store Management & Movement",
    items: [
      {
        to: "/locations",
        label: "Item Locations (Bins/Shelves)",
        icon: MapPin,
      },
      { to: "/bin-cards", label: "Bin Cards & Bin Transfers", icon: Package },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
      },
      { to: "/disposal", label: "Flag Items for Disposal", icon: Recycle },
    ],
  },
  {
    section: "Inventory Records & Takes",
    items: [
      { to: "/stock-cards", label: "Store Stock Cards", icon: Boxes },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
      { to: "/stock-control", label: "Physical Counts & Takes", icon: Scale },
    ],
  },
];

// 4. Store Clerk / Storekeeper Navigation
const STOCK_CLERK_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Storekeeper Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Assisting Operations",
    items: [
      {
        to: "/goods-receipt",
        label: "Record Goods Receipt",
        icon: PackageCheck,
      },
      { to: "/locations", label: "Item Locations (Bins)", icon: MapPin },
      { to: "/bin-cards", label: "Bin Cards & Transfers", icon: Package },
      { to: "/stock-control", label: "Physical Stock Counts", icon: Scale },
    ],
  },
  {
    section: "Store Reference Records",
    items: [
      {
        to: "/requisitions",
        label: "Store Requisitions (View)",
        icon: ClipboardList,
      },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (View)",
        icon: CheckSquare,
      },
      { to: "/stock-cards", label: "Store Stock Cards", icon: Boxes },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
    ],
  },
];

// 5. Technical Evaluation Committee (TEC) Navigation
const TEC_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Technical Evaluation Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Technical Inspections & Evaluations",
    items: [
      {
        to: "/goods-receipt",
        label: "Receipts Inspection (GRN)",
        icon: PackageCheck,
      },
      { to: "/returns", label: "Returns Evaluation (SRN)", icon: Undo2 },
      { to: "/disposal", label: "Disposal Justifications", icon: Recycle },
    ],
  },
  {
    section: "Technical Specifications & Audit",
    items: [
      { to: "/items", label: "Item Specifications", icon: Tags },
      { to: "/audit-log", label: "Inspection Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 6. Property Registration Officer (PRO) Navigation
const PRO_NAV = [
  {
    section: "Overview",
    items: [
      { to: "/", label: "PRO Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    section: "Official Documentation",
    items: [
      {
        to: "/goods-receipt",
        label: "GRN Generation (Model 19)",
        icon: FileCheck2,
      },
      { to: "/fixed-assets", label: "Fixed Asset Register", icon: CreditCard },
    ],
  },
  {
    section: "Custodian Management",
    items: [
      {
        to: "/fixed-assets",
        label: "User-Cards & Custody Assignments",
        icon: UserCheck,
      },
    ],
  },
  {
    section: "Supporting Records",
    items: [
      { to: "/goods-receipt", label: "Goods Receipts Log", icon: PackageCheck },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
      { to: "/suppliers", label: "Suppliers & GRN Sources", icon: Truck },
    ],
  },
  {
    section: "Audit & Compliance",
    items: [
      { to: "/audit-log", label: "Fixed Asset Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 7. Department / Unit Head Navigation
const DEPT_HEAD_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Department Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Unit Requisitions & Approvals",
    items: [
      {
        to: "/requisitions",
        label: "Submit Store Requisition",
        icon: ClipboardList,
      },
      {
        to: "/requisitions?view=staff-approvals",
        label: "Approve Staff Requisitions",
        icon: CheckSquare,
      },
      {
        to: "/returns?view=staff-approvals",
        label: "Approve Staff Returns",
        icon: Undo2,
      },
    ],
  },
  {
    section: "Returns & Transfers",
    items: [
      {
        to: "/returns",
        label: "Submit Material Return (SRN)",
        icon: Undo2,
      },
      {
        to: "/transfers",
        label: "Initiate Material Transfer",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    section: "Unit Property & Stock Records",
    items: [
      {
        to: "/fixed-assets",
        label: "Unit Fixed Assets & User-Cards",
        icon: CreditCard,
      },
      { to: "/stock-cards", label: "Stock Overview (Read-Only)", icon: Boxes },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
    ],
  },
];

// 8. Accountant / Finance Officer Navigation
const ACCOUNTANT_NAV = [
  {
    section: "Overview",
    items: [
      { to: "/", label: "Finance Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    section: "Financial Reporting",
    items: [
      { to: "/reports", label: "Inventory Valuation (FIFO)", icon: DollarSign },
      {
        to: "/reports?type=fixed-asset-register",
        label: "Fixed Asset Register",
        icon: CreditCard,
      },
      {
        to: "/reports?type=stock-take-reconciliation",
        label: "Stock Take Reconciliation",
        icon: Scale,
      },
      {
        to: "/reports?type=disposal-summary",
        label: "Disposal Financial Summary",
        icon: Recycle,
      },
    ],
  },
  {
    section: "Write-Off & Disposal",
    items: [{ to: "/disposal", label: "Disposal Write-Offs", icon: Recycle }],
  },
  {
    section: "Supporting Records",
    items: [
      { to: "/stock-cards", label: "Stock Cards (FIFO Ledger)", icon: Boxes },
      {
        to: "/fixed-assets",
        label: "Fixed Assets & User-Cards",
        icon: CreditCard,
      },
      { to: "/items", label: "Item Master Catalog", icon: Tags },
    ],
  },
];

// 9. Disposal Committee Navigation
const DISPOSAL_COMMITTEE_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Disposal Committee Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Disposal Decisions",
    items: [
      {
        to: "/disposal?view=pending",
        label: "Pending Disposal Requests",
        icon: Recycle,
      },
      {
        to: "/disposal?view=history",
        label: "Disposal History & Resolutions",
        icon: GanttChartSquare,
      },
    ],
  },
  {
    section: "Supporting Documentation",
    items: [
      { to: "/items", label: "Item Specifications", icon: Tags },
      { to: "/fixed-assets", label: "Fixed Asset Register", icon: CreditCard },
      { to: "/audit-log", label: "Inspection Audit Trail", icon: ShieldCheck },
    ],
  },
];

// 10. Campus Security Officer Navigation
const SECURITY_NAV = [
  {
    section: "Overview",
    items: [
      {
        to: "/",
        label: "Security Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    section: "Gate Clearance & Verification",
    items: [
      {
        to: "/issue-vouchers",
        label: "Issued Vouchers — Model 22 (View)",
        icon: CheckSquare,
      },
      { to: "/issue-vouchers", label: "Gate Clearance Log", icon: ShieldAlert },
    ],
  },
  {
    section: "Supporting Records",
    items: [
      { to: "/stores", label: "Stores & Location Reference", icon: Warehouse },
    ],
  },
];

// Default operational navigation for other roles
const DEFAULT_OPERATIONAL_NAV = [
  {
    section: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    section: "Setup",
    items: [
      { to: "/stores", label: "Stores", icon: Warehouse },
      { to: "/categories", label: "Item Categories", icon: Tags },
      { to: "/locations", label: "Item Locations", icon: MapPin },
      { to: "/items", label: "Item Master", icon: Package },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    section: "Receiving",
    items: [
      {
        to: "/goods-receipt",
        label: "Goods Receipt & GRN",
        icon: PackageCheck,
      },
    ],
  },
  {
    section: "Stock Records",
    items: [
      { to: "/stock-cards", label: "Stock Cards", icon: Boxes },
      { to: "/bin-cards", label: "Bin Cards", icon: Boxes },
    ],
  },
  {
    section: "Issuing",
    items: [
      { to: "/requisitions", label: "Store Requisitions", icon: ClipboardList },
      {
        to: "/issue-vouchers",
        label: "Issue Vouchers (SIV/ISIV)",
        icon: ClipboardList,
      },
    ],
  },
  {
    section: "Property",
    items: [
      { to: "/fixed-assets", label: "Fixed Assets", icon: CreditCard },
      { to: "/returns", label: "Material Returns", icon: Undo2 },
      {
        to: "/transfers",
        label: "Inter-Store Transfers",
        icon: ArrowLeftRight,
      },
      { to: "/disposal", label: "Disposal Workflow", icon: Recycle },
    ],
  },
  {
    section: "Stock Control",
    items: [
      {
        to: "/stock-control",
        label: "Monitoring, Takes & Valuation",
        icon: Scale,
      },
    ],
  },
  {
    section: "Insights & Governance",
    items: [
      { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
      { to: "/audit-log", label: "Audit Log", icon: ShieldCheck },
    ],
  },
];

export default function Sidebar({ open, onNavigate }) {
  const { currentUser } = useApp();
  const location = useLocation();
  const isAdmin = currentUser?.role === "Administrator";
  const isPAO = currentUser?.role === "Property Administration Officer";
  const isStoreHead = currentUser?.role === "Store Head";
  const isStockClerk = currentUser?.role === "Stock Clerk";
  const isTEC = currentUser?.role === "Technical Evaluation Committee";
  const isPRO = currentUser?.role === "Property Registration Officer";
  const isDeptHead = currentUser?.role === "Department Head";
  const isAccountant = currentUser?.role === "Accountant";
  const isDisposalCommittee = currentUser?.role === "Disposal Committee";
  const isSecurity = currentUser?.role === "Campus Security Officer";

  let navigation = DEFAULT_OPERATIONAL_NAV;
  let directorateLabel = "Property Administration";

  if (isAdmin) {
    navigation = ADMIN_NAV;
    directorateLabel = "ICT Directorate";
  } else if (isPAO) {
    navigation = PAO_NAV;
    directorateLabel = "Procurement & Property Directorate";
  } else if (isStoreHead) {
    navigation = STORE_HEAD_NAV;
    directorateLabel = "Store Operations & Management";
  } else if (isStockClerk) {
    navigation = STOCK_CLERK_NAV;
    directorateLabel = "Storekeeper & Stock Operations";
  } else if (isTEC) {
    navigation = TEC_NAV;
    directorateLabel = "Technical Evaluation Panel";
  } else if (isPRO) {
    navigation = PRO_NAV;
    directorateLabel = "Property Records & Asset Registry";
  } else if (isDeptHead) {
    navigation = DEPT_HEAD_NAV;
    directorateLabel = "Department & Unit Operations";
  } else if (isAccountant) {
    navigation = ACCOUNTANT_NAV;
    directorateLabel = "Finance & Valuation Office";
  } else if (isDisposalCommittee) {
    navigation = DISPOSAL_COMMITTEE_NAV;
    directorateLabel = "Disposal Authorization Board";
  } else if (isSecurity) {
    navigation = SECURITY_NAV;
    directorateLabel = "Campus Gate Security";
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between bg-navy-900 text-navy-100 transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-500 text-white shadow-sm ring-1 ring-white/10">
            <Warehouse size={19} strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              Stock Mgmt System
            </p>
            <p className="text-[10px] font-medium text-navy-300 truncate">
              {directorateLabel}
            </p>
          </div>
        </div>

        <nav className="h-[calc(100vh-8.5rem)] overflow-y-auto px-3 py-4">
          {navigation.map((section) => (
            <div key={section.section} className="mb-5">
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-navy-400">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={`${item.to}-${item.label}`}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) => {
                      const itemUrl = new URL(item.to, window.location.origin);
                      const queryActive = itemUrl.search
                        ? location.pathname === itemUrl.pathname &&
                          location.search === itemUrl.search
                        : isActive && !location.search;
                      return `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                        queryActive
                          ? "bg-white/12 text-white font-medium shadow-sm ring-1 ring-white/10"
                          : "text-navy-200 hover:bg-white/5 hover:text-white"
                      }`;
                    }}
                  >
                    <item.icon size={16} className="shrink-0 text-navy-300" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3 bg-navy-950/40">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-500/20 text-clay-300 text-xs font-semibold">
            {currentUser?.name ? currentUser.name.charAt(0) : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {currentUser?.name || "Logged In User"}
            </p>
            <p className="truncate text-[10px] text-navy-300">
              {currentUser?.role || "Guest"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
