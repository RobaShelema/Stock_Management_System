# University Stock and Property Management System (SPMS)

An enterprise-grade, full-stack **Stock, Inventory, and Property Management System (SPMS)** engineered for universities, academic colleges, and public sector institutions. 

SPMS is built to satisfy strict institutional accounting standards, public procurement regulations, and statutory material management guidelines (including official Ethiopian Public Sector standards: **Model 19 GRN**, **Model 20 Preliminary SIV**, **Model 22 Final SIV**, **Model 21 Store Return Note**, and **Model 15 Custodian User-Cards**).

---

## 📑 Table of Contents

1. [System Introduction & Purpose](#1-system-introduction--purpose)
2. [Important Concepts & Domain Rules](#2-important-concepts--domain-rules)
   - [2.1 Dual-Ledger Accounting: Stock Cards vs. Bin Cards](#21-dual-ledger-accounting-stock-cards-vs-bin-cards)
   - [2.2 Real FIFO Cost-Lot Engine](#22-real-fifo-cost-lot-engine)
   - [2.3 Database-Enforced Append-Only Ledger](#23-database-enforced-append-only-ledger)
   - [2.4 Cryptographic SHA-256 Chained Audit Trail](#24-cryptographic-sha-256-chained-audit-trail)
   - [2.5 Statutory Model Documents & Print Engine](#25-statutory-model-documents--print-engine)
   - [2.6 Dynamic Zero-Drift Projections (Database Views)](#26-dynamic-zero-drift-projections-database-views)
   - [2.7 Separation of Duties & Approval Chains](#27-separation-of-duties--approval-chains)
3. [Actor Roles & Permission Matrix](#3-actor-roles--permission-matrix)
4. [What the System Does (Core Modules)](#4-what-the-system-does-core-modules)
5. [Complete End-to-End System Workflows](#5-complete-end-to-end-system-workflows)
   - [Workflow 1: Inbound Goods Receipt & GRN (Model 19)](#workflow-1-inbound-goods-receipt--grn-model-19)
   - [Workflow 2: Store Requisition, SIV Model 20/22 & Gate Clearance](#workflow-2-store-requisition-siv-model-2022--gate-clearance)
   - [Workflow 3: Fixed Asset Registration & User-Cards (Model 15)](#workflow-3-fixed-asset-registration--user-cards-model-15)
   - [Workflow 4: Material Returns (Store Return Note - SRN)](#workflow-4-material-returns-store-return-note---srn)
   - [Workflow 5: Inter-Store Material Transfers](#workflow-5-inter-store-material-transfers)
   - [Workflow 6: Institutional Disposal Committee Lifecycle](#workflow-6-institutional-disposal-committee-lifecycle)
   - [Workflow 7: Physical Stock Taking & Reconciliation](#workflow-7-physical-stock-taking--reconciliation)
   - [Workflow 8: Reorder, Safety Stock & Shelf-Life Alerts](#workflow-8-reorder-safety-stock--shelf-life-alerts)
6. [Technology Stack & System Architecture](#6-technology-stack--system-architecture)
7. [How to Run (Installation & Setup)](#7-how-to-run-installation--setup)
   - [7.1 Prerequisites](#71-prerequisites)
   - [7.2 Database Setup](#72-database-setup)
   - [7.3 Backend Setup](#73-backend-setup)
   - [7.4 Frontend Setup](#74-frontend-setup)
   - [7.5 Running the Entire System](#75-running-the-entire-system)
   - [7.6 Seeded Demo Accounts](#76-seeded-demo-accounts)
8. [REST API Reference Summary](#8-rest-api-reference-summary)
9. [Project Directory Structure](#9-project-directory-structure)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. System Introduction & Purpose

In large educational institutions, universities, and public bodies, tracking goods from procurement to disposal is plagued by manual paper trails, stock discrepancies, lack of traceability, and audit vulnerabilities. 

**SPMS (Stock and Property Management System)** resolves these challenges by providing an automated, tamper-resistant, multi-store material lifecycle platform.

### Core Objectives
* **Complete Material Lifecycle Visibility**: Tracks consumables and fixed assets from initial vendor receipt, technical inspection, storage bin allocation, requisitioning, issuing, gate departure, return, and eventual committee-approved disposal.
* **Strict Statutory & Audit Compliance**: Implements official public sector stock documents (Model 19, 20, 22, SRN, Model 15) and maintains an unalterable SHA-256 chained audit trail.
* **Real FIFO Financial Valuation**: Avoids vague estimation by tracking discrete cost lots per intake, ensuring accurate valuation reports and balance sheets.
* **Preventing Stockouts & Waste**: Live monitoring of reorder levels, safety stock thresholds, and shelf-life / expiry dates.
* **Decentralized Multi-Store Management**: Supports Central Stores, College/Department Stores, and specialized units (e.g., Cafeteria Stores) with inter-store transfer controls.

---

## 2. Important Concepts & Domain Rules

### 2.1 Dual-Ledger Accounting: Stock Cards vs. Bin Cards

SPMS enforces a strict distinction between **global inventory valuation** and **localized physical storage**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             STOCK CARD LEDGER                               │
│                   Scope: Organization-wide (per item)                       │
│  - Tracks total institutional balance (qty_on_hand) and FIFO valuation.    │
│  - Updated on Receipts, Issues, Returns, Disposals, and Reconciliations.    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│        BIN CARD LEDGER        │             │        BIN CARD LEDGER        │
│   Scope: Main Store (MS-01)   │             │  Scope: Eng College (DS-01)   │
│ - Tracks physical location:   │             │ - Tracks physical location:   │
│   Shelf A-12, Bin B-04        │             │   Shelf C-01, Bin D-09        │
│ - Updated on Store Receipts,  │             │ - Updated on Store Receipts,  │
│   Issues, & Transfers         │             │   Issues, & Transfers         │
└───────────────────────────────┘             └───────────────────────────────┘
```

* **Stock Card (`stock_card_entries`)**: An institution-wide financial and quantitative ledger for an item. An inter-store transfer does **not** change the overall `qty_on_hand` on the Stock Card because the item remains within the institution.
* **Bin Card (`bin_card_entries`)**: A physical storekeeper's ledger tied to a specific `(store_id, bin, item_id)`. An inter-store transfer updates Bin Cards at both origin and destination stores.

---

### 2.2 Real FIFO Cost-Lot Engine

Unlike systems using weighted averages, SPMS maintains a dedicated FIFO lot engine (`cost_lots`):
1. **Intake**: Each approved Goods Receipt creates a discrete cost lot recording `qty_received`, `qty_remaining`, `unit_cost`, `expiry_date`, and `source_reference` (e.g., GRN number).
2. **Consumption**: When materials are issued (Model 22), disposed of, transferred out, or adjusted downward, the system depletes the **oldest available cost lot first**.
3. **Valuation**: Current inventory valuation reflects the exact purchase costs of remaining active lots.

---

### 2.3 Database-Enforced Append-Only Ledger

To prevent fraud and satisfy external state audits, historical records cannot be overwritten:
* Triggers (`trg_stock_card_append_only`, `trg_bin_card_append_only`, `trg_audit_log_append_only`, `trg_reconciliation_append_only`) execute the PL/pgSQL function `reject_update_delete()`.
* Any direct `UPDATE` or `DELETE` executed against ledger tables raises a PostgreSQL exception.
* **Discrepancies must be corrected via authorized, timestamped compensating entries** (e.g., Stock Reconciliation entries).

---

### 2.4 Cryptographic SHA-256 Chained Audit Trail

The audit log operates similarly to a blockchain ledger:
* Each log entry stores the `previous_hash` of the preceding row.
* A SHA-256 hash (`entry_hash`) is calculated across: `(previous_hash, user_id, user_name, role, module, action, timestamp)`.
* If any historical entry is tampered with, the cryptographic chain is invalidated, making unauthorized modifications immediately detectable.

---

### 2.5 Statutory Model Documents & Print Engine

SPMS contains a dedicated A4 printable document rendering engine matching standard public sector forms:

| Model Code | Formal Document Name | Purpose & Workflow Trigger |
| :--- | :--- | :--- |
| **Model 19** | **Goods Receiving Note (GRN)** | Generated by Property Registration Officer after TEC technical acceptance. Official proof of vendor delivery. |
| **Model 20** | **Preliminary Store Issue Voucher (SIV)** | Prepared by Store Head upon approved requisition. Contains warning watermarks prohibiting material dispatch. |
| **Model 22** | **Final Store Issue Voucher (ISIV)** | Finalized issue voucher authorizing warehouse dispatch, updating FIFO ledgers and requiring security gate clearance. |
| **SRN (Model 21)** | **Store Return Note** | Form for returning unused, damaged, or obsolete property back to warehouse custody. |
| **Model 15** | **User-Card (Custodian Register)** | Master record of all capital equipment and fixed assets held under the custody of a specific staff member. |

*Features*: Multi-signatory authorization blocks, institutional crest header, ISO 216 A4 margins, `page-break-inside: avoid` signature blocks, and complete suppression of screen navigation elements during browser print/PDF export.

---

### 2.6 Dynamic Zero-Drift Projections (Database Views)

To eliminate data duplication and synchronization bugs, critical views are computed dynamically in PostgreSQL:
* `user_cards_view`: Aggregates active fixed assets (`status IN ('In Use', 'Transferred')`) grouped by custodian name and department.
* `reorder_alerts_view`: Real-time calculation of usable inventory `(qty_on_hand - disposal_reserved_qty)` compared against item `reorder_level` and `safety_stock_level`.
* `shelf_life_alerts_view`: Live calculation comparing current dates with earliest expiring cost lots (flagging items as `Expired`, `Near-Expiry`, or `Available`).

---

### 2.7 Separation of Duties & Approval Chains

No single individual possesses end-to-end authority over property:
* Requesters cannot approve their own requisitions.
* Storekeepers cannot generate formal GRNs or approve technical inspections.
* Technical Evaluation Committee (TEC) handles quality and physical condition inspection without having store ledger write privileges.
* Campus Security verifies finalized issue vouchers at the gate independently of warehouse staff.

---

## 3. Actor Roles & Permission Matrix

SPMS defines **11 institutional roles** with server-side RBAC enforcement:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 INSTITUTIONAL ROLES                              │
├────────────────────────────────┬─────────────────────────────────────────────────┤
│ Administrator                  │ IT Directorate — Configuration, Users, Backups  │
│ Property Admin Officer (PAO)   │ Senior Approval Authority, Disposals, Transfers │
│ Store Head                     │ Warehouse Operations, Preliminary/Final SIV     │
│ Stock Clerk                    │ Bin Location, Counts, Material Handling         │
│ Tech Evaluation Committee(TEC) │ Technical Inspection of Deliveries & Returns    │
│ Property Registration Officer  │ GRN Generation (Model 19), Fixed Asset Tagging  │
│ Department Head                │ Department Requisitions, Endorsements, Returns  │
│ Requesting Staff               │ Material Requisitions, Custodian of User-Card   │
│ Accountant                     │ FIFO Valuation, Financial Asset Write-Offs      │
│ Disposal Committee             │ Final Valuation & Disposal Method Decisions     │
│ Campus Security Officer        │ Gate Exit Clearance for Dispatched Model 22 SIV │
└────────────────────────────────┴─────────────────────────────────────────────────┘
```

### Full Role Permission Matrix

| Module / Operation | Admin | PAO | Store Head | Stock Clerk | TEC | PRO | Dept Head | Staff | Accountant | Disposal Comm. | Security |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **User Account & Role Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Store & Category Configuration** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Supplier Master Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Item Master Setup & Cataloging** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Record Goods Receipt** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Evaluate Goods Receipt (TEC)** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Generate GRN (Model 19)** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Submit Store Requisition** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Department Approval (Requisition)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Senior Approval (PAO)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Prepare Preliminary SIV (Model 20)**| ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Finalize Issue Voucher (Model 22)** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Campus Gate Clearance** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Fixed Asset Tagging & Registration**| ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Custodian User-Card Access** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Initiate Store Return (SRN)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **TEC Return Inspection** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SRN Restock / Scrap Decision** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inter-Store Material Transfers** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Flag Items for Disposal** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Forward Disposal to Committee** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Disposal Committee Ruling** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Financial Write-Off Approval** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Schedule Physical Stock Take** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Physical Stock Count Entry** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Authorize Reconciliation** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FIFO Valuation & Financial Reports** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **System Health, Backup & Audit Logs**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. What the System Does (Core Modules)

1. **Authentication & Session Security**: JWT-based authentication with bcrypt password hashing, session recovery from `localStorage`, and real-time role-based navigation.
2. **Master Data Management**: Stores (Central, Departmental, Cafeteria), Categories, Storage Bins/Shelves, Suppliers, and Items (Consumables & Fixed Assets).
3. **Goods Receiving & Quality Inspection**: Goods receipt intake against Purchase Orders, technical inspection by TEC, and GRN generation.
4. **Perpetual Ledgers (Stock & Bin Cards)**: Automatic double-entry records tracking quantity balances, reference document IDs, and FIFO cost impacts.
5. **Requisition & Issue Fulfillment**: Multi-tier approval flow transitioning from request to Preliminary Voucher (Model 20), Final Voucher (Model 22), and Gate Clearance.
6. **Fixed Asset Management & User-Cards**: Asset serialization/tagging, custodian assignment, custody transfer logs, and physical verification audits.
7. **Store Return Workflow (SRN)**: Cross-referenced against original issue vouchers, evaluated for physical condition (Serviceable, Damaged, Obsolete), and restocked or routed to disposal.
8. **Inter-Store Material Transfers**: Authorizes and tracks movement between internal university stores without altering global institutional stock value.
9. **Disposal Lifecycle & Committee Board**: Reserves stock from active inventory, routes damaged/obsolete assets through committee review, logs disposal methods (Auction, Destruction, Donation, Write-off), and records financial write-offs.
10. **Stock Control & Physical Taking**: Automated scheduling of counts, blind/recorded physical counting, variance detection, and authorized reconciliation entries.
11. **Stock Alert Monitoring**: Continuous evaluation of safety stock breaches, reorder level alerts, and 30-day shelf-life / expiry warnings.
12. **Analytics & Financial Valuation**: Real-time FIFO inventory valuation, stock status reports, fixed asset register summaries, supplier delivery summaries, and disposal summaries.
13. **Cryptographic Audit Log**: Immutable record of all system events, searchable by module, user, and date range.
14. **System Health & Maintenance**: Active database connection monitoring, automated backup triggers, and latency health endpoints (`/api/health`, `/api/ready`).

---

## 5. Complete End-to-End System Workflows

### Workflow 1: Inbound Goods Receipt & GRN (Model 19)

```mermaid
sequenceDiagram
    autonumber
    actor Sup as Supplier
    actor SH as Store Head / Clerk
    actor TEC as Technical Evaluation Committee
    actor PRO as Property Registration Officer
    participant DB as PostgreSQL (Ledgers & Lots)

    Sup->>SH: Delivers items with PO reference
    SH->>DB: Records Goods Receipt (Status: Awaiting Evaluation)
    TEC->>DB: Conducts physical inspection & records decision (Approved/Rejected)
    PRO->>DB: Inspects technical clearance & triggers "Generate GRN"
    DB->>DB: Generates Model 19 GRN Ref
    DB->>DB: Creates FIFO Cost Lot (qty, cost, expiry)
    DB->>DB: Appends Stock Card Entry (+qty)
    DB->>DB: Appends Bin Card Entry (+qty at assigned shelf)
    opt If Item is Fixed Asset
        PRO->>DB: Tags asset & registers in Fixed Asset Master
    end
```

---

### Workflow 2: Store Requisition, SIV Model 20/22 & Gate Clearance

```mermaid
sequenceDiagram
    autonumber
    actor Requester as Requesting Staff / Dept Head
    actor DH as Department Head
    actor PAO as Property Admin Officer
    actor SH as Store Head
    actor CSO as Campus Security Officer
    participant DB as PostgreSQL (FIFO & Ledgers)

    Requester->>DB: Submits Store Requisition
    DH->>DB: Endorses Requisition (Status: Pending PAO Approval)
    PAO->>DB: Grants Institutional Approval (Status: Approved)
    SH->>DB: Prepares Preliminary Issue Voucher (Model 20)
    Note over SH,DB: Model 20 has watermark "DO NOT DISPATCH"
    PAO->>DB: Reviews & authorizes / amends quantities
    SH->>DB: Finalizes Issue Voucher (Model 22 - Dispatched)
    DB->>DB: Consumes FIFO Cost Lots (Oldest first)
    DB->>DB: Appends Stock Card Entry (-qty)
    DB->>DB: Appends Bin Card Entry (-qty)
    CSO->>DB: Verifies Model 22 physical goods at Campus Exit Gate
    CSO->>DB: Records Gate Clearance (Timestamp & Security Pass)
```

---

### Workflow 3: Fixed Asset Registration & User-Cards (Model 15)

```mermaid
graph TD
    A[GRN Model 19 Completed for Fixed Asset] --> B[Property Registration Officer Tags Asset]
    B --> C[Assign Asset to Custodian Name & Department]
    C --> D[(Fixed Assets Table)]
    D --> E[Dynamic Projection: user_cards_view Model 15]
    E --> F[Printable User-Card Document]
    D --> G[Custody Transfer Initiated]
    G --> H[Record fixed_asset_custody_history]
    D --> I[Periodic Physical Verification]
    I --> J[Record fixed_asset_verifications: Verified / Exception]
```

---

### Workflow 4: Material Returns (Store Return Note - SRN)

```mermaid
graph LR
    A[Staff / Department Head] -->|Initiates Return against SIV Ref| B(Store Return Note - SRN)
    B -->|Department Endorsement| C{TEC Technical Inspection}
    C -->|Condition: Serviceable| D[PAO / Store Head Approves Restock]
    C -->|Condition: Damaged / Obsolete| E[Flag for Disposal Workflow]
    D -->|Post Inbound Stock Entry| F[(Stock & Bin Card Updated +qty)]
```

---

### Workflow 5: Inter-Store Material Transfers

```mermaid
sequenceDiagram
    autonumber
    actor Origin as Origin Store Head
    actor PAO as Property Admin Officer
    actor Dest as Destination Store Head
    participant DB as PostgreSQL (Bin Cards)

    Origin->>DB: Requests Transfer (From Store A -> Store B)
    PAO->>DB: Evaluates stock balance & Approves Transfer
    DB->>DB: Decrements Bin Card at Origin Store A
    DB->>DB: Increments Bin Card at Destination Store B
    Note over DB: Global Stock Card qty_on_hand remains unchanged
    Dest->>DB: Confirms physical receipt at destination bin
```

---

### Workflow 6: Institutional Disposal Committee Lifecycle

```mermaid
graph TD
    A[Store Head / TEC Flags Expired / Damaged Item] --> B[Disposal Request Created]
    B --> C[System increments disposal_reserved_qty on Item]
    Note1[Stock is locked: Usable Qty = Total Qty - Reserved Qty]
    C --> D[PAO Reviews & Forwards to Disposal Committee]
    D --> E[Disposal Committee Convenes]
    E --> F{Select Disposal Method}
    F -->|Auction| G[Record Auction Proceeds & Issue Certificate]
    F -->|Destruction| H[Record Environmental Destruction Protocol]
    F -->|Donation| I[Record Institutional Donee Transfer]
    F -->|Write-Off| J[Accountant Approves Financial Loss Amount]
    G & H & I & J --> K[Final Stock Disposal Execution]
    K --> L[(Stock Card Append: Disposal -qty & FIFO Lot Removal)]
```

---

### Workflow 7: Physical Stock Taking & Reconciliation

```mermaid
sequenceDiagram
    autonumber
    actor PAO as Property Admin Officer
    actor Clerk as Stock Clerk / Store Head
    participant DB as PostgreSQL (Stock Takes)

    PAO->>DB: Schedules Stock Take for Store (Status: Scheduled)
    Clerk->>DB: Initiates Counting (Status: Counting)
    Clerk->>DB: Enters Physical Counts per item line
    DB->>DB: Computes Variance = (Counted Qty - System Qty)
    PAO->>DB: Reviews Discrepancy & Finding Notes
    PAO->>DB: Authorizes Reconciliation
    DB->>DB: Inserts Immutable reconciliation_entries
    DB->>DB: Posts Compensating Adjustment to Stock Card & Bin Card
    DB->>DB: Updates cost_lots (adds lot if gain, consumes if deficit)
```

---

### Workflow 8: Reorder, Safety Stock & Shelf-Life Alerts

```
                                  ITEM INVENTORY BALANCE
                                     [qty_on_hand]
                                           │
                        Disposal Reserved  │  Usable Quantity
                        [disposal_reserved]│  [usable_qty]
                                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │                     EVALUATION ENGINE                       │
             │                                                             │
             │   usable_qty <= safety_stock_level                          │
             │   ──► Alert: "CRITICAL: Safety Stock Breach"                │
             │                                                             │
             │   usable_qty <= reorder_level                               │
             │   ──► Alert: "WARNING: Reorder Level Reached"               │
             │                                                             │
             │   earliest_lot_expiry <= CURRENT_DATE                       │
             │   ──► Alert: "EXPIRED: Immediate Disposal Action Required"  │
             │                                                             │
             │   earliest_lot_expiry <= CURRENT_DATE + 7 Days              │
             │   ──► Alert: "NEAR-EXPIRY: Expiring within 7 days"          │
             └─────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack & System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (sms-frontend)                        │
│  React 18  •  Vite 5  •  Tailwind CSS  •  Lucide Icons  •  React Router 6   │
│  - AppContext (Central Auth & Real-Time Resource Cache)                     │
│  - api.js (Fetch Wrapper + Auto snake_case ↔ camelCase Transformer)         │
│  - Official Printable Document Layout Engine (@media print A4)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON REST API (Bearer JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (sms-backend)                           │
│  Node.js 18+  •  Express 4  •  Helmet Security  •  Morgan  •  pg (Pool)     │
│  - JWT Authentication & RBAC Middleware (requireRole)                       │
│  - FIFO Cost-Lot Valuation Engine (fifo.js)                                 │
│  - Reference Number Generator (refNo.js)                                    │
│  - Cryptographic SHA-256 Audit Logger (audit.js)                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQL Queries & Transaction Blocks
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (PostgreSQL 14+)                      │
│  - 25 Relational Tables (Users, Stores, Items, Lots, Vouchers, Assets)      │
│  - 4 Append-Only Enforcing Trigger Functions (reject_update_delete)         │
│  - 3 Dynamic Computed Projections (user_cards_view, alerts views)          │
│  - Cryptographic Hash Chains for Audit Logs                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. How to Run (Installation & Setup)

### 7.1 Prerequisites
* **Node.js**: Version 18 or higher (Node 20 LTS recommended) — [Download](https://nodejs.org)
* **PostgreSQL**: Version 14 or higher — [Download](https://www.postgresql.org)
* **Git**: [Download](https://git-scm.com)

---

### 7.2 Database Setup

1. Verify PostgreSQL is running:
   ```bash
   psql --version
   ```
2. Create a fresh database named `spms`:
   ```bash
   # Using CLI
   createdb spms

   # Or inside the PostgreSQL shell:
   # psql -U postgres
   # CREATE DATABASE spms;
   ```

---

### 7.3 Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd sms-backend
   ```
2. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```
3. Open `sms-backend/.env` and configure your database connection string and a secure JWT secret:
   ```env
   PORT=4000
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/spms
   JWT_SECRET=super_secret_jwt_passphrase_change_me_in_production
   JWT_EXPIRES_IN=8h
   NODE_ENV=development
   ```
4. Install backend dependencies:
   ```bash
   npm install
   ```
5. Apply database schema and triggers:
   ```bash
   npm run migrate
   ```
6. Seed database with university stores, catalog items, and demo accounts:
   ```bash
   npm run seed
   ```
7. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend will start at `http://localhost:4000`.*

---

### 7.4 Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd sms-frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `VITE_API_URL=http://localhost:4000/api`)*
3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will start at `http://localhost:5173`.*

---

### 7.5 Running the Entire System (Single Command)

From the root workspace directory, you can run both backend and frontend concurrently:
```bash
npm install
npm run dev
```

---

### 7.6 Seeded Demo Accounts

Every seeded account is configured with the standard demo password: **`Demo@1234`**

| Role | Name | Email Address | Default Department |
| :--- | :--- | :--- | :--- |
| **Administrator** | Abel Tesfaye | `abel.admin@university.edu` | IT Directorate |
| **Property Administration Officer** | Meron Alemu | `meron.pao@university.edu` | Property Administration |
| **Store Head** | Dawit Bekele | `dawit.store@university.edu` | Central Store (MS-01) |
| **Stock Clerk** | Sara Getachew | `sara.clerk@university.edu` | Central Store (MS-01) |
| **Technical Evaluation Committee** | Yonas Kebede | `yonas.tec@university.edu` | Quality & Inspection |
| **Property Registration Officer** | Hana Girma | `hana.registration@university.edu` | Property Registry |
| **Department Head** | Tewodros Fikru | `tewodros.dept@university.edu` | Engineering College |
| **Accountant** | Selam Mulu | `selam.acct@university.edu` | Finance Directorate |
| **Disposal Committee Board** | Committee Board | `disposal.committee@university.edu`| Institutional Disposal |
| **Campus Security Officer** | Girum Assefa | `girum.security@university.edu`| Campus Security Division |

*(Tip: On the frontend login screen, click **"Seeded demo accounts"** to auto-fill any user profile instantly.)*

---

## 8. REST API Reference Summary

All API endpoints reside under `/api` and require an HTTP header `Authorization: Bearer <token>` (except public auth routes and health check).

```
Auth & System
  POST   /api/auth/login                       - User login & JWT issuance (Public)
  GET    /api/auth/me                          - Get active authenticated user profile
  GET    /api/health                           - Liveness & DB latency check (Public)
  GET    /api/ready                            - System readiness probe (Public)
  GET    /api/system/health                    - Full database performance metrics
  POST   /api/system/backup                    - Trigger manual database backup

Master Data & Setup
  GET/POST       /api/users                    - List users / Create user (Admin)
  POST           /api/users/:id/toggle-status  - Deactivate / Activate user (Admin)
  GET/POST       /api/stores                   - List stores / Configure store (Admin, PAO)
  GET/POST       /api/categories               - List categories / Add category (Admin, Store Head)
  GET/POST       /api/suppliers                - List / Register suppliers (Admin, PAO, Store Head)
  GET/POST       /api/items                    - List catalog items / Create item (Admin, PRO)
  GET/POST       /api/item-locations           - List item bins / Assign bin (Store Head, Clerk)

Goods Receipt & Quality Evaluation
  GET/POST       /api/goods-receipts           - List receipts / Record delivery (Store Head, Clerk)
  POST           /api/goods-receipts/:id/evaluate    - Record TEC inspection decision (TEC)
  POST           /api/goods-receipts/:id/generate-grn- Issue Model 19 GRN (PRO)

Stock & Bin Cards (Ledgers)
  GET    /api/stock-cards/:itemId              - View item organization-wide Stock Card ledger
  GET    /api/bin-cards                        - View physical store Bin Cards
  POST   /api/bin-cards/transfer               - Execute internal bin-to-bin relocation

Requisition & Issue Vouchers
  GET/POST       /api/requisitions             - List / Submit Store Requisition (Staff, Dept Head)
  POST           /api/requisitions/:id/decide  - Endorse / Approve Requisition (Dept Head, PAO)
  GET            /api/issue-vouchers           - View Issue Vouchers (Store Head, PAO, Security)
  POST           /api/issue-vouchers/preliminary    - Prepare Preliminary SIV Model 20 (Store Head)
  POST           /api/issue-vouchers/:id/finalize   - Finalize Issue Voucher Model 22 (Store Head, PAO)
  POST           /api/issue-vouchers/:id/gate-clearance - Record Gate Security Exit (Security Officer)

Fixed Assets & Custodian User-Cards
  GET/POST       /api/fixed-assets             - List assets / Register tagged asset (PRO)
  GET            /api/fixed-assets/user-cards  - View Custodian User-Cards (Model 15)
  POST           /api/fixed-assets/:id/custody - Transfer custody to new staff (PAO, PRO)
  POST           /api/fixed-assets/:id/verify  - Record physical asset verification (PAO, PRO)

Returns & Inter-Store Transfers
  GET/POST       /api/returns                  - List returns / Initiate SRN (Staff, Dept Head)
  POST           /api/returns/:id/evaluate     - Record TEC return condition grade (TEC)
  POST           /api/returns/:id/decide       - Restock or route to disposal (PAO, Store Head)
  GET/POST       /api/transfers                - List / Request Inter-Store Transfer (Store Head)
  POST           /api/transfers/:id/decide     - Approve / Reject transfer (PAO)

Disposal Management
  GET/POST       /api/disposal-requests        - List requests / Flag item for disposal (Store Head, TEC)
  POST           /api/disposal-requests/:id/forward - Forward to Committee (PAO)
  POST           /api/disposal-requests/:id/decide  - Record Committee Disposal Decision (Disposal Comm.)
  POST           /api/disposal-requests/:id/financial-write-off - Record Financial Loss Write-Off (Accountant)

Stock Control & Auditing
  GET            /api/stock-control/alerts     - View Reorder & Safety Stock breaches
  GET/POST       /api/stock-control/stock-takes- List / Schedule physical stock count (PAO)
  POST           /api/stock-control/stock-takes/:id/lines/:lineId/count - Record physical count (Clerk)
  POST           /api/stock-control/stock-takes/:id/reconcile - Authorize variance adjustment (PAO, Store Head)
  GET            /api/stock-control/valuation  - FIFO financial valuation report (Accountant, PAO)
  GET            /api/reports/:type            - Stock status, asset register, supplier reports
  GET            /api/audit-logs               - Query immutable SHA-256 chained audit trail (Admin, PAO)
```

---

## 9. Project Directory Structure

```text
Stock Management System/
├── package.json                    # Workspace root scripts (concurrent execution)
├── README.md                       # Master system documentation
├── sms-backend/                    # Node.js + Express + PostgreSQL Backend
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql              # DDL: 25 tables, views, triggers, hash functions
│   │   ├── migrate.js              # Database migration runner
│   │   └── seed.js                 # Realistic university seed data generator
│   ├── scripts/
│   │   └── performance-check.js    # Concurrency and latency benchmark tool
│   └── src/
│       ├── server.js               # Server bootstrap & port listener
│       ├── app.js                  # Express middleware & route mounting
│       ├── config/
│       │   ├── db.js               # PostgreSQL connection pool & transaction helper
│       │   └── roles.js            # Role definitions & authority groups
│       ├── middleware/
│       │   ├── authenticate.js     # JWT token verification
│       │   ├── requireRole.js      # Strict per-route RBAC enforcement
│       │   └── errorHandler.js     # Centralized error formatter
│       ├── utils/
│       │   ├── audit.js            # SHA-256 hash-chained audit logger
│       │   ├── fifo.js             # FIFO cost lot engine (intake, consumption, valuation)
│       │   ├── refNo.js            # Unique institutional reference number generator
│       │   └── binCard.js          # Bin card transaction helpers
│       ├── controllers/            # 21 modular business logic controllers
│       └── routes/                 # 21 Express route definitions
└── sms-frontend/                   # React 18 + Vite + Tailwind CSS Frontend
    ├── package.json
    ├── .env.example
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx                # React DOM entry point
        ├── App.jsx                 # Client router & page protection
        ├── index.css               # Design tokens & @media print styles
        ├── lib/
        │   └── api.js              # REST client with automatic camelCase conversion
        ├── context/
        │   └── AppContext.jsx      # Global session & reactive state store
        ├── components/
        │   ├── layout/             # Sidebar, Topbar, AppLayout
        │   ├── ui/                 # DataTable, Modal, Badge, Toast, Button
        │   └── documents/          # Official printable A4 document components
        │       ├── InstitutionalDocumentLayout.jsx
        │       ├── DocumentSignatures.jsx
        │       ├── DocumentViewerModal.jsx
        │       ├── GRNDocument.jsx               # Model 19 GRN
        │       ├── SIVModel20Document.jsx        # Model 20 Preliminary SIV
        │       ├── SIVModel22Document.jsx        # Model 22 Final SIV
        │       ├── SRNDocument.jsx               # Model 21 SRN
        │       ├── StoreRequisitionDocument.jsx  # Store Requisition Form
        │       └── UserCardDocument.jsx          # Model 15 Custodian Card
        └── pages/                  # Modular view screens
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── stores/             # Stores, Categories, Bins
            ├── items/              # Item Master catalog
            ├── suppliers/          # Supplier directory
            ├── receipt/            # Goods Receipt -> TEC -> GRN
            ├── cards/              # Stock Cards & Bin Cards
            ├── requisition/        # Requisitions & Issue Vouchers
            ├── assets/             # Fixed Assets & User-Cards
            ├── returns/            # Store Return Notes (SRN)
            ├── transfers/          # Inter-Store Transfers
            ├── disposal/           # Disposal Committee Workflow
            ├── stockControl/       # Stock Taking, Reorder Alerts, FIFO Valuation
            ├── reports/            # Institutional Analytics & Registers
            ├── audit/              # Audit Trail Explorer
            ├── system/             # System Health & Data Backup
            └── users/              # User Account Management
```

---

## 10. Troubleshooting & FAQs

### Q: Why do I get `ECONNREFUSED` when running migrations or starting the backend?
* **Answer**: PostgreSQL is either not running or the `DATABASE_URL` in `sms-backend/.env` is incorrect. Verify your database connection with:
  ```bash
  psql "$DATABASE_URL" -c "SELECT 1;"
  ```

### Q: Why do I receive `403 Forbidden` on certain API requests or UI buttons?
* **Answer**: RBAC is enforced strictly on the server. You are logged in with an account that is not authorized for that specific action (e.g., attempting to generate a GRN while logged in as a Store Head instead of a Property Registration Officer). Switch to the appropriate role listed in the [Seeded Demo Accounts](#76-seeded-demo-accounts) table.

### Q: Can I manually edit or delete rows in `stock_card_entries` or `audit_logs` in PostgreSQL?
* **Answer**: No. The database contains active append-only triggers (`trg_stock_card_append_only`, `trg_audit_log_append_only`) that raise an exception if an `UPDATE` or `DELETE` is executed. Corrections must be submitted as new, authorized transactions (such as a Reconciliation entry).

### Q: How do I clean and re-seed the database?
* **Answer**: Drop and re-create the database:
  ```bash
  dropdb spms
  createdb spms
  cd sms-backend
  npm run migrate
  npm run seed
  ```

### Q: Why are navigation bars and buttons hidden when I print an official document?
* **Answer**: This is a core architectural feature. The system isolates official institutional documents (Model 19, 20, 22, SRN, User-Cards) using `@media print` rules to produce clean, high-contrast, professional A4 PDF/paper documents with proper headers and signature blocks, omitting all interactive UI controls.

---

## 📜 License & Compliance

Designed and developed for academic and public enterprise stock management compliance. All rights reserved.
