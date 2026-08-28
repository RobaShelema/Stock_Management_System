# SPMS Backend — University Stock and Property Management System

A Node.js + Express + PostgreSQL REST API implementing every module and use case from the
Build Specification: authentication/RBAC, store setup, goods receipt with Technical Evaluation
Committee approval and GRN generation, auto-maintained Stock Cards (FIFO) and Bin Cards,
Store Requisition → SIV/ISIV (Model 20/22) issuing, Fixed Assets and User-Cards, Material
Returns (SRN), Inter-Store Transfers, the Disposal Committee workflow, Reorder/Safety-Stock
monitoring, Physical Stock Taking, Reconciliation, FIFO Valuation reporting, and an
append-only Audit Log.

---

## 1. Requirements

- **Node.js 18+** and npm — <https://nodejs.org>
- **PostgreSQL 14+** — <https://www.postgresql.org/download/>
  (a local install, Docker container, or a managed instance like Supabase/Neon/RDS all work)

Check your versions:

```bash
node -v
psql --version
```

## 2. Setup

### 2.1 Create the database

Using the `psql` CLI (adjust user/host as needed):

```bash
createdb spms
```

Or from inside `psql`:

```sql
CREATE DATABASE spms;
```

### 2.2 Configure environment variables

```bash
cd spms-backend
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your PostgreSQL connection, and replace
`JWT_SECRET` with a random string:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For production, configure HTTPS before starting the API. For direct Node TLS,
set `SSL_KEY_PATH` and `SSL_CERT_PATH`. If a trusted reverse proxy terminates
TLS, set `TLS_TERMINATED_BY_PROXY=true` and set `CORS_ORIGINS` to the exact
HTTPS frontend origins. Production startup refuses to serve plain HTTP without
one of these TLS configurations.

### 2.3 Install dependencies

```bash
npm install
```

### 2.4 Apply the schema

```bash
npm run migrate
```

This runs `db/schema.sql`, which creates all 25 tables, 2 views, and the append-only
enforcement triggers described in Section 8 of the Build Specification.

### 2.5 Seed demo data

```bash
npm run seed
```

This creates one demo user per actor role, four stores (Central, two college stores, a
cafeteria store), seven items with opening stock, and a few sample records at different
workflow stages (a pending goods receipt, an approved requisition, a registered fixed asset).

The seed script prints all demo account emails at the end. **Every demo account's password is
`Demo@1234`.**

### 2.6 Run the server

```bash
npm run dev      # with auto-restart on file changes (nodemon)
# or
npm start        # plain node
```

The API exposes `/api/health` for liveness and database latency, and `/api/ready`
for readiness checks. With the server running, execute `npm run perf` to issue
100 concurrent health requests and measure the p95 response time. Override
`PERF_URL`, `PERF_CONCURRENCY`, or `PERF_TARGET_MS` when benchmarking a deployed
environment.

You should see:

```text
SPMS backend listening on http://localhost:4000
Health check: http://localhost:4000/api/health
```

## 3. Trying it out

```bash
# Health check
curl http://localhost:4000/api/health

# Log in as the Store Head demo account
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dawit.store@university.edu","password":"Demo@1234"}'
```

Copy the `token` from the response and use it on every subsequent request:

```bash
curl http://localhost:4000/api/goods-receipts \
  -H "Authorization: Bearer <token>"
```

### Suggested end-to-end walkthrough

1. Log in as **Store Head** (`dawit.store@university.edu`) → `POST /api/goods-receipts` to record a new receipt.
2. Log in as **Technical Evaluation Committee** (`yonas.tec@university.edu`) → `POST /api/goods-receipts/:id/evaluate` with `{"decision":"Approved","remarks":"..."}`.
3. Log in as **Property Registration Officer** (`hana.registration@university.edu`) → `POST /api/goods-receipts/:id/generate-grn`.
4. Check `GET /api/stock-cards/:itemId` — the receipt should now appear and the balance should have increased.
5. Log in as **Department Head** (`tewodros.dept@university.edu`) → `POST /api/requisitions`.
6. Log in as **Property Administration Officer** (`meron.pao@university.edu`) → `POST /api/requisitions/:id/decide` with `{"decision":"Approved"}`.
7. Back as **Store Head** → `POST /api/issue-vouchers/preliminary` with `{"requisitionId":"..."}`, then `POST /api/issue-vouchers/:id/finalize`.
8. Log in as **Campus Security Officer** (`girum.security@university.edu`) → `GET /api/issue-vouchers` to view only finalized Model 22 vouchers, then `POST /api/issue-vouchers/:id/gate-clearance` to record gate clearance.
9. Check the Stock Card and `GET /api/bin-cards` again — stock should have decreased.
10. Try the same request with the wrong role logged in (e.g. Campus Security Officer approving a requisition) and confirm you get `403 Forbidden` — RBAC is enforced server-side, not just hidden in a UI.

## 4. API reference

All routes are prefixed with `/api` and (except `/auth/login` and `/health`) require
`Authorization: Bearer <token>`.

| Module         | Method & Path                                                                                                                | Allowed Roles                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Auth           | `POST /auth/login`                                                                                                           | Public                                              |
| Auth           | `POST /auth/logout`, `GET /auth/me`                                                                                          | Any authenticated user                              |
| Users          | `GET /users`                                                                                                                 | Any authenticated user                              |
| Users          | `POST /users`, `POST /users/:id/toggle-status`                                                                               | Administrator                                       |
| Stores         | `GET /stores`                                                                                                                | Any                                                 |
| Stores         | `POST /stores`, `POST /stores/:id/toggle-status`                                                                             | Administrator, PAO                                  |
| Categories     | `GET /categories`                                                                                                            | Any                                                 |
| Categories     | `POST /categories`                                                                                                           | Administrator, Store Head                           |
| Item Locations | `GET /item-locations`                                                                                                        | Any                                                 |
| Item Locations | `POST /item-locations`                                                                                                       | Store Head, Stock Clerk, Administrator              |
| Items          | `GET /items`                                                                                                                 | Any                                                 |
| Items          | `POST /items`                                                                                                                | Administrator, Property Registration Officer        |
| Suppliers      | `GET /suppliers`                                                                                                             | Any                                                 |
| Suppliers      | `POST /suppliers`                                                                                                            | Administrator, PAO, Store Head                      |
| Suppliers      | `POST /suppliers/:id/toggle-status`                                                                                          | Administrator, PAO                                  |
| Goods Receipt  | `GET /goods-receipts`                                                                                                        | Any                                                 |
| Goods Receipt  | `POST /goods-receipts`                                                                                                       | Store Head, Stock Clerk, Administrator              |
| Goods Receipt  | `POST /goods-receipts/:id/evaluate`                                                                                          | Technical Evaluation Committee, Administrator       |
| Goods Receipt  | `POST /goods-receipts/:id/generate-grn`                                                                                      | Property Registration Officer, Administrator        |
| Stock Cards    | `GET /stock-cards/:itemId`                                                                                                   | Any                                                 |
| Bin Cards      | `GET /bin-cards`, `GET /bin-cards/:id/entries`                                                                               | Any                                                 |
| Bin Cards      | `POST /bin-cards/transfer`                                                                                                   | Store Head, Stock Clerk, Administrator              |
| Requisitions   | `GET /requisitions`                                                                                                          | Any                                                 |
| Requisitions   | `POST /requisitions`                                                                                                         | Department Head, Administrator                      |
| Requisitions   | `POST /requisitions/:id/decide`                                                                                              | Department Head, PAO, Administrator                 |
| Issue Vouchers | `GET /issue-vouchers`                                                                                                        | Store Head, PAO, Dept Head, Campus Security Officer |
| Issue Vouchers | `POST /issue-vouchers/preliminary`                                                                                           | Store Head                                          |
| Issue Vouchers | `POST /issue-vouchers/:id/gate-clearance`                                                                                    | Campus Security Officer                             |
| Issue Vouchers | `POST /issue-vouchers/:id/amend`                                                                                             | PAO, Dept Head                                      |
| Issue Vouchers | `POST /issue-vouchers/:id/finalize`                                                                                          | Store Head, PAO                                     |
| Fixed Assets   | `GET /fixed-assets`, `GET /fixed-assets/user-cards`                                                                          | Any                                                 |
| Fixed Assets   | `POST /fixed-assets`                                                                                                         | Property Registration Officer, Administrator        |
| Returns        | `GET /returns`                                                                                                               | Any                                                 |
| Returns        | `POST /returns`                                                                                                              | Department Head, Administrator                      |
| Returns        | `POST /returns/:id/evaluate`                                                                                                 | Technical Evaluation Committee, Administrator       |
| Returns        | `POST /returns/:id/decide`                                                                                                   | PAO, Store Head, Administrator                      |
| Transfers      | `GET /transfers`                                                                                                             | Any                                                 |
| Transfers      | `POST /transfers`                                                                                                            | Store Head, Department Head, Administrator          |
| Transfers      | `POST /transfers/:id/decide`                                                                                                 | PAO, Administrator                                  |
| Disposal       | `GET /disposal-requests`                                                                                                     | Store Head, TEC, PAO, Disposal Committee            |
| Disposal       | `POST /disposal-requests`                                                                                                    | Store Head, TEC                                     |
| Disposal       | `POST /disposal-requests/:id/forward`                                                                                        | PAO                                                 |
| Disposal       | `POST /disposal-requests/:id/decide`                                                                                         | Disposal Committee                                  |
| Stock Control  | `GET /stock-control/alerts`                                                                                                  | Any                                                 |
| Stock Control  | `GET /stock-control/stock-takes`, `GET /stock-control/stock-takes/:id`                                                       | Any                                                 |
| Stock Control  | `POST /stock-control/stock-takes`                                                                                            | PAO, Administrator                                  |
| Stock Control  | `POST /stock-control/stock-takes/:id/lines/:lineId/count`                                                                    | Store Head, Stock Clerk, Administrator              |
| Stock Control  | `POST /stock-control/stock-takes/:id/reconcile`                                                                              | PAO, Store Head, Administrator                      |
| Stock Control  | `GET /stock-control/valuation?itemId=`                                                                                       | Accountant, PAO, Administrator                      |
| Reports        | `GET /reports/:type` (`stock-status`, `fixed-asset-register`, `supplier-summary`, `disposal-summary`, `requisition-summary`) | PAO, Accountant, Store Head, Administrator          |
| Audit Log      | `GET /audit-logs?module=&user=&from=&to=`                                                                                    | Administrator, PAO                                  |

## 5. Design notes

- **FIFO valuation is real, not estimated.** `src/utils/fifo.js` maintains `cost_lots` per
  item and consumes the oldest lot first on every issue, transfer-out, disposal, or negative
  reconciliation. `GET /stock-control/valuation` reflects actual remaining lot costs.
- **Stock Card vs. Bin Card scope.** The Stock Card (`stock_card_entries`) is an
  organization-wide ledger per item. The Bin Card (`bin_card_entries`) is per store/bin.
  An inter-store transfer therefore updates Bin Cards at both ends but does not change an
  item's global `qty_on_hand` — the organization's total stock is unchanged, only its location.
- **Append-only ledgers are enforced by the database**, not just application code — see the
  `reject_update_delete()` trigger in `db/schema.sql`, applied to `stock_card_entries`,
  `bin_card_entries`, `audit_logs`, and `reconciliation_entries`. Attempting `UPDATE` or
  `DELETE` on these tables raises a Postgres exception.
- **RBAC is enforced per-route** via `requireRole(...)` middleware (`src/middleware/requireRole.js`),
  not only hidden in a frontend — see Section 4 above for the full role matrix.
- **User-Cards and Reorder Alerts are database views**, not separate mutable tables
  (`user_cards_view`, `reorder_alerts_view` in `db/schema.sql`), so they can never drift out
  of sync with the underlying data.

## 6. Connecting the previously built frontend

If you have the React/Vite frontend from this project already, point it at this API by
replacing the in-memory logic in `src/context/AppContext.jsx` with `fetch` calls to
`http://localhost:4000/api/...`, storing the JWT from `/auth/login` (e.g. in React state or
`sessionStorage`) and sending it as `Authorization: Bearer <token>` on every request. No page
component needs to change — they all already consume data through `useApp()`.

## 7. Project structure

```text
spms-backend/
├── package.json
├── .env.example
├── db/
│   ├── schema.sql       # Full DDL: tables, views, append-only triggers
│   ├── migrate.js        # Applies schema.sql
│   └── seed.js            # Demo data: users, stores, items, sample transactions
└── src/
    ├── server.js          # Entry point
    ├── app.js              # Express app, route mounting
    ├── config/
    │   ├── db.js            # PostgreSQL pool, query/withTransaction helpers
    │   └── roles.js          # Role list, shared role groupings
    ├── middleware/
    │   ├── authenticate.js  # JWT verification
    │   ├── requireRole.js    # RBAC enforcement
    │   ├── asyncHandler.js    # Async route error forwarding
    │   └── errorHandler.js     # Centralized error responses
    ├── utils/
    │   ├── audit.js          # Audit log writer
    │   ├── refNo.js            # Reference number generator
    │   ├── fifo.js               # FIFO cost-lot engine (receive/consume/valuation)
    │   └── binCard.js              # Bin card ledger helpers
    ├── controllers/          # One per module — business logic
    └── routes/                 # One per module — route + RBAC wiring
```

## 8. Troubleshooting

- **`ECONNREFUSED` on migrate/seed/start**: PostgreSQL isn't running or `DATABASE_URL` is
  wrong. Confirm with `psql "$DATABASE_URL" -c "select 1;"`.
- **`relation "..." does not exist`**: run `npm run migrate` before `npm run seed` or
  `npm run dev`.
- **`duplicate key value violates unique constraint` on seed**: you've already seeded this
  database. The seed script is safe to re-run for users/stores/categories/items (it upserts
  those), but sample transactional records (the demo goods receipt, requisition, fixed asset)
  will fail on a second run — drop and recreate the database if you want a fully clean slate:

  ```bash
  dropdb spms && createdb spms && npm run migrate && npm run seed
  ```

- **`403 Forbidden` on a request you expect to work**: check the role matrix in Section 4 —
  you're logged in with a role that isn't authorized for that action. This is enforced
  deliberately at the API layer.
- **Attempting to `UPDATE`/`DELETE` a Stock Card, Bin Card, or Audit Log row directly in SQL
  fails with an exception**: that's intentional (see Section 5) — insert a correcting entry
  instead.
