# Stock Management System — Frontend

A React + Vite + Tailwind CSS frontend implementing every module of the University Stock and
Property Management System (SPMS): store/category/location setup, goods receipt with Technical
Evaluation Committee approval and GRN (Model 19) generation, auto-maintained Stock Cards (FIFO)
and Bin Cards, Store Requisition → SIV/ISIV (Model 20/22) issuing, Fixed Asset registration with
per-custodian User-Cards, Material Returns (SRN), Inter-Store Transfers, the Disposal Committee
workflow, **Reorder/Safety-Stock alerts, Physical Stock Taking, Reconciliation, and FIFO
Valuation reporting**, Reports/Analytics, Audit Log, and Users & Roles.

**This build talks to the real SPMS backend API** — it no longer uses in-memory mock data. You
need the `sms-backend` project running first (see its own README for setup: PostgreSQL schema,
migration, seed data, and the Express API server).

---

## 1. Requirements

- **Node.js 18 or later** (Node 20 LTS recommended) — https://nodejs.org
- **npm** (comes with Node.js)
- **VS Code** (or any editor) — https://code.visualstudio.com
- **The `sms-backend` API running** (default: `http://localhost:4000`) — set it up first:
  ```bash
  cd sms-backend
  cp .env.example .env    # set DATABASE_URL and JWT_SECRET
  npm install
  npm run migrate
  npm run seed
  npm run dev              # leave this running in its own terminal
  ```

Check your versions:
```bash
node -v
npm -v
```

## 2. Setup

1. Unzip the project and open the folder in VS Code:
   ```bash
   cd sms-frontend
   code .
   ```
2. Copy the environment template. The default already points at the backend's default port, so
   you usually don't need to change anything:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. With the backend already running in its own terminal, start the frontend:
   ```bash
   npm run dev
   ```
5. Vite will print a local URL, typically `http://localhost:5173/`. It should open automatically;
   if not, open it manually.

## 3. Logging in

The login screen now performs **real authentication** against the backend (`POST /api/auth/login`),
not a role picker. Use one of the accounts the backend's `npm run seed` created — click "Seeded
demo accounts" on the login screen to see and auto-fill them. Every seeded account's password is
`Demo@1234`.

Your session (a JWT) is kept in `localStorage`, so refreshing the page keeps you logged in until
you explicitly log out or the token expires (8 hours by default).

**Suggested end-to-end walkthrough** (matches the backend README's walkthrough):
1. Log in as **Store Head** (`dawit.store@university.edu`) → *Goods Receipt & GRN* → "Record Goods Receipt".
2. Log out, log in as **Technical Evaluation Committee** (`yonas.tec@university.edu`) → evaluate the pending receipt.
3. Log in as **Property Registration Officer** (`hana.registration@university.edu`) → "Generate GRN" → check *Stock Cards* — the balance and FIFO cost lot update automatically.
4. Log in as **Department Head** → *Store Requisitions* → submit a request.
5. Log in as **Property Administration Officer** → approve it, then as **Store Head** create the preliminary voucher (Model 20) and finalize it (Model 22) under *Issue Vouchers* — watch stock and the Bin Card update.
6. Visit **Stock Control** (new) to see reorder alerts, schedule a physical stock take, record counts, reconcile a discrepancy, and pull a FIFO valuation report.
7. Check *Fixed Assets*, *Material Returns*, *Inter-Store Transfers*, and *Disposal Workflow* the same way, each gated to the correct role.
8. Everything you do is recorded in *Audit Log* — try the same action logged in as the wrong role and confirm you get a clear permission error instead of a silent failure.

## 4. Available scripts

| Command           | Description                                  |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Start the local dev server with hot reload    |
| `npm run build`    | Build an optimized production bundle to `dist/` |
| `npm run preview`  | Preview the production build locally          |

## 5. Project structure

```
sms-frontend/
├── index.html
├── package.json
├── .env.example              # VITE_API_URL — points at the backend
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx                 # App entry point
    ├── App.jsx                  # Route definitions (includes /stock-control)
    ├── index.css                # Tailwind + global styles
    ├── lib/
    │   └── api.js                # API client: fetch wrapper, auth token, snake_case→camelCase
    ├── context/
    │   └── AppContext.jsx       # Auth state + API-backed data for every module
    ├── components/
    │   ├── layout/               # Sidebar, Topbar, AppLayout
    │   ├── ui/                   # DataTable, Modal, Badge, PageHeader, Button, ToastHost
    │   └── ProtectedRoute.jsx    # Redirects to /login; waits for session restore first
    └── pages/
        ├── Login.jsx              # Real email/password login
        ├── Dashboard.jsx
        ├── stores/                # Stores, Categories, Item Locations
        ├── items/                 # Item Master
        ├── suppliers/
        ├── receipt/                # Goods Receipt → TEC Evaluation → GRN
        ├── cards/                  # Stock Cards, Bin Cards (+ bin-to-bin transfer)
        ├── requisition/            # Requisitions, Issue Vouchers (SIV/ISIV, + amend)
        ├── assets/                 # Fixed Assets + User-Cards (from the real backend view)
        ├── returns/                # Material Returns (SRN)
        ├── transfers/               # Inter-Store Transfers
        ├── disposal/                 # Disposal Workflow
        ├── stockControl/              # NEW: Reorder alerts, Stock Taking, Reconciliation, FIFO Valuation
        ├── reports/                    # Reports & Analytics (live from the backend)
        ├── audit/                      # Audit Log
        └── users/                      # Users & Roles
```

## 6. How the API connection works

- **`src/lib/api.js`** is the single point of contact with the backend. Every method maps to one
  backend route (see `sms-backend/README.md` Section 4 for the full list). Responses are
  deep-converted from the backend's `snake_case` SQL column names (e.g. `ref_no`, `qty_on_hand`)
  to `camelCase` (`refNo`, `qtyOnHand`) automatically, so every page uses one consistent naming
  convention regardless of which query produced the data.
- **`src/context/AppContext.jsx`** holds the JWT-authenticated session and every data collection
  the app needs, fetched from the API on login (and restored from `localStorage` on refresh).
  Every mutating action (`addGoodsReceipt`, `decideRequisition`, `finalizeVoucher`, …) calls the
  matching API method, then refreshes only the resource lists that could have changed, and shows
  a success or error toast either way.
- **Role-gated UI buttons are a convenience, not the real security boundary.** The backend
  independently rejects any action the logged-in role isn't authorized for (HTTP 403), exactly as
  described in the backend's RBAC table — the frontend hiding a button is just so you don't have
  to discover that the hard way by clicking it.

## 7. Recommended VS Code extensions

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier — Code formatter**

## 8. Troubleshooting

- **Login fails with "Could not reach the API..."**: the backend isn't running, or
  `VITE_API_URL` in `.env` doesn't match where it's listening. Confirm with
  `curl http://localhost:4000/api/health`.
- **Login fails with "Invalid credentials"**: make sure you ran `npm run seed` in `sms-backend`,
  and that you're using the exact seeded email and the password `Demo@1234`.
- **A page shows empty/stale data after an action**: the relevant resource wasn't in that action's
  refresh list — check `runAction(..., { refreshKeys: [...] })` for that action in
  `AppContext.jsx`; a manual full refresh always happens on login/page-reload.
- **`403 Forbidden` toast after clicking an action**: your logged-in role isn't authorized for
  that action at the API level — this is intentional (see Section 6). Log in as a role from the
  backend's RBAC table that is.
- **`npm install` fails / network errors**: make sure you have internet access and a recent npm
  version (`npm -v`, upgrade with `npm install -g npm`).
- **Port 5173 already in use**: stop whatever is using it, or run `npm run dev -- --port 5174`.
- **Tailwind styles not applying**: confirm `tailwind.config.js` `content` paths match your file
  locations (already configured for this project) and restart `npm run dev` after any config
  change.
