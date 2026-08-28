# Implementation Plan: Property Administration Officer (PAO) Setup & RBAC

Implement the comprehensive permissions, approval workflows, university-wide visibility, and dynamic sidebar navigation for the **Property Administration Officer (PAO) — Procurement & Property Directorate**.

---

## User Review Required

> [!IMPORTANT]
> **PAO Senior Gatekeeper Authority**:
> PAO serves as the university-wide senior approver across store requisitions, preliminary voucher amendments (Model 20), evaluated store returns, inter-store transfers, and disposal request review/forwarding to the Disposal Committee.

---

## Proposed Changes

### 1. Dynamic Role-Based Sidebar Navigation

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/components/layout/Sidebar.jsx)
- Define a dedicated `PAO_NAV` structure for **Property Administration Officer**:
  - **Overview**: PAO Dashboard (`/`)
  - **Senior Approvals**:
    - Store Requisitions (`/requisitions`)
    - Issue Vouchers (Model 20/22) (`/issue-vouchers`)
    - Material Returns (`/returns`)
    - Inter-Store Transfers (`/transfers`)
    - Disposal Requests (`/disposal`)
  - **University Stock & Assets**:
    - Stock Cards (University-wide) (`/stock-cards`)
    - Bin Cards (All Store Bins) (`/bin-cards`)
    - Fixed Assets & Custody (`/fixed-assets`)
    - Item Master & Catalog (`/items`)
    - Stores & Locations (`/stores`, `/categories`, `/locations`)
    - Goods Receipts & GRN (`/goods-receipt`)
    - Suppliers & Donors (`/suppliers`)
  - **Stock Control & Analytics**:
    - Stock Takes & Reconciliation (`/stock-control`)
    - Reports & Valuation Export (`/reports`)
    - Governance Audit Log (`/audit-log`)

---

### 2. PAO Senior Executive Dashboard

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/Dashboard.jsx)
- Implement a dedicated PAO view highlighting:
  - **Senior Approval Queue Summary**: Pending Requisitions, Preliminary Issue Vouchers awaiting amendment/approval, Evaluated Returns awaiting decision, Pending Transfers, and Disposal requests awaiting forwarding.
  - **University-Wide Stock KPIs**: Total Stock Valuation (ETB), Active Items, Stores, and Safety Stock breaches.
  - **Quick Approvals & Forwarding Hub**: Direct action triggers to quickly review and approve pending requests across all operational workflows.
  - **Recent Institutional Activity & Alerts**: Live alerts on low-stock items and university-wide transaction feed.

---

### 3. Workflow Pages & Permission Adjustments

#### [MODIFY] [Requisitions.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/requisition/Requisitions.jsx)
- Ensure PAO has clear Approve / Reject action buttons with visual approval status indicators and requisition detail inspection.

#### [MODIFY] [IssueVouchers.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/requisition/IssueVouchers.jsx)
- PAO can amend quantity on preliminary vouchers (Model 20) and finalize/approve for issuing (Model 22).

#### [MODIFY] [Returns.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/returns/Returns.jsx)
- PAO can decide on evaluated returns (Approve/Reject after TEC inspection), automatically triggering stock restoration (serviceable) or disposal flagging (damaged/obsolete).

#### [MODIFY] [Transfers.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/transfers/Transfers.jsx)
- PAO can approve or reject inter-store transfer requests between campus store units.

#### [MODIFY] [Disposal.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/disposal/Disposal.jsx)
- Support PAO review and endorsement to forward flagged disposal requests to the Disposal Committee.

#### [MODIFY] [Reports.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/reports/Reports.jsx) & [reports.controller.js](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-backend/src/controllers/reports.controller.js)
- Add comprehensive Inventory Valuation, Stock Movement History, and Physical Take Reconciliation reports with CSV export and print capabilities.

#### [MODIFY] [StockControl.jsx](file:///c:/Users/robas/OneDrive/Desktop/Stock%20Management%20System/sms-frontend/src/pages/stockControl/StockControl.jsx)
- Support PAO scheduling physical counts and finalizing stock reconciliation with discrepancy findings notes.

---

## Verification Plan

### Automated Build Verification
- Execute `npm run build` in `sms-frontend` to verify all components compile cleanly.
- Verify backend routes and controllers.

### Manual Verification
- Log in as **Property Administration Officer (`meron.pao@university.edu`)**:
  - Verify sidebar renders all PAO sections (Senior Approvals, University Stock & Assets, Stock Control & Analytics).
  - Verify PAO Dashboard displays approval queues and university-wide valuation.
  - Test approving/rejecting a requisition.
  - Test amending and approving an issue voucher (Model 20).
  - Test deciding on an evaluated return.
  - Test approving an inter-store transfer.
  - Test reviewing disposal requests.
  - Test generating inventory, movement, and valuation reports.
  - Test stock take scheduling and reconciliation review.
