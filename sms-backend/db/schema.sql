-- ============================================================================
-- University Stock and Property Management System (SPMS)
-- Database Schema — PostgreSQL 14+
--
-- Implements the Entity Dictionary from Section 8 of the Build Specification.
-- Ledger tables (stock_card_entries, bin_card_entries, audit_logs) are made
-- append-only with triggers: UPDATE and DELETE are rejected at the database
-- level. Corrections must be new, authorized reconciliation entries, never
-- edits to history.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extension for UUID generation
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reusable enum-like domains via CHECK constraints (kept as TEXT for easy
-- extension without a migration to alter a Postgres ENUM type).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY
);

INSERT INTO roles (code) VALUES
  ('Administrator'),
  ('Property Administration Officer'),
  ('Store Head'),
  ('Stock Clerk'),
  ('Technical Evaluation Committee'),
  ('Property Registration Officer'),
  ('Department Head'),
  ('Requesting Staff'),
  ('Accountant'),
  ('Disposal Committee'),
  ('Campus Security Officer')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES roles(code),
  store_id UUID,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- Rename the legacy label without leaving an obsolete login role behind.
UPDATE users SET role = 'Campus Security Officer' WHERE role = 'Security Officer';
UPDATE users SET department = 'Engineering College'
WHERE email = 'tewodros.dept@university.edu' AND department IS NULL;
DELETE FROM roles WHERE code = 'Security Officer';

-- ---------------------------------------------------------------------------
-- Stores, Categories, Item Locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Main Store', 'Department Store', 'Cafeteria Store')),
  head_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_store_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
UPDATE users SET store_id = (SELECT id FROM stores WHERE code = 'DS-01')
WHERE email = 'tewodros.dept@university.edu' AND store_id IS NULL;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  unit TEXT NOT NULL DEFAULT 'Piece',
  type TEXT NOT NULL CHECK (type IN ('Consumable', 'Fixed Asset')),
  reorder_level NUMERIC(14, 2) NOT NULL DEFAULT 0,
  safety_stock_level NUMERIC(14, 2) NOT NULL DEFAULT 0,
  qty_on_hand NUMERIC(14, 2) NOT NULL DEFAULT 0,
  disposal_reserved_qty NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (disposal_reserved_qty >= 0),
  default_unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  shelf_life_status TEXT NOT NULL DEFAULT 'Available'
    CHECK (shelf_life_status IN ('Available', 'Near-Expiry', 'Expired', 'Damaged', 'Pending Disposal', 'Disposed')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS disposal_reserved_qty NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS shelf_life_status TEXT NOT NULL DEFAULT 'Available';
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_shelf_life_status_check;
ALTER TABLE items ADD CONSTRAINT items_shelf_life_status_check
  CHECK (shelf_life_status IN ('Available', 'Near-Expiry', 'Expired', 'Damaged', 'Pending Disposal', 'Disposed'));

CREATE TABLE IF NOT EXISTS item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  bin TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, store_id)
);

-- ---------------------------------------------------------------------------
-- Goods Receipt, Technical Evaluation, GRN
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  expiry_date DATE,
  po_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Awaiting Evaluation'
    CHECK (status IN ('Awaiting Evaluation', 'Approved', 'Rejected', 'GRN Generated')),
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE goods_receipts ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Polymorphic technical evaluation, reused for goods receipts and store returns.
CREATE TABLE IF NOT EXISTS technical_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('goods_receipt', 'store_return')),
  entity_id UUID NOT NULL,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('Approved', 'Rejected', 'Serviceable', 'Damaged', 'Obsolete')),
  remarks TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tech_eval_entity ON technical_evaluations (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS grns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id UUID UNIQUE NOT NULL REFERENCES goods_receipts(id),
  grn_number TEXT UNIQUE NOT NULL,
  generated_by UUID NOT NULL REFERENCES users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FIFO cost lots (mutable working balance — NOT the immutable ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  source_reference TEXT NOT NULL, -- e.g. GRN number
  qty_received NUMERIC(14, 2) NOT NULL CHECK (qty_received > 0),
  qty_remaining NUMERIC(14, 2) NOT NULL CHECK (qty_remaining >= 0),
  unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
  expiry_date DATE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cost_lots_item_fifo ON cost_lots (item_id, received_at);
ALTER TABLE cost_lots ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- ---------------------------------------------------------------------------
-- Stock Card (append-only ledger per item)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_card_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  type TEXT NOT NULL CHECK (type IN ('Receipt', 'Issue', 'Return', 'Transfer In', 'Transfer Out', 'Adjustment', 'Disposal')),
  qty NUMERIC(14, 2) NOT NULL, -- signed: positive for inbound, negative for outbound
  balance NUMERIC(14, 2) NOT NULL, -- running balance after this entry
  cost_amount NUMERIC(14, 2), -- FIFO cost impact of this entry, where applicable
  reference TEXT NOT NULL, -- GRN/SIV/ISIV/SRN/adjustment reference
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_card_item ON stock_card_entries (item_id, created_at);

-- ---------------------------------------------------------------------------
-- Bin Card (append-only ledger per store/bin/item)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bin_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  bin TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  UNIQUE (store_id, bin, item_id)
);

CREATE TABLE IF NOT EXISTS bin_card_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_card_id UUID NOT NULL REFERENCES bin_cards(id),
  direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  reference TEXT NOT NULL,
  qty NUMERIC(14, 2) NOT NULL,
  balance NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bin_card_entries_card ON bin_card_entries (bin_card_id, created_at);

-- ---------------------------------------------------------------------------
-- Store Requisition and Issue Vouchers (SIV/ISIV, Model 20/22)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  status TEXT NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Pending Department Approval', 'Pending PAO Approval', 'Pending Approval', 'Approved', 'Rejected', 'Issued')),
  decided_by UUID REFERENCES users(id),
  department_approved_by UUID REFERENCES users(id),
  department_approved_at TIMESTAMPTZ,
  pao_approved_by UUID REFERENCES users(id),
  pao_approved_at TIMESTAMPTZ,
  decision_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE store_requisitions DROP CONSTRAINT IF EXISTS store_requisitions_status_check;
ALTER TABLE store_requisitions ADD CONSTRAINT store_requisitions_status_check
  CHECK (status IN ('Pending Department Approval', 'Pending PAO Approval', 'Pending Approval', 'Approved', 'Rejected', 'Issued'));
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS department_approved_by UUID REFERENCES users(id);
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMPTZ;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS pao_approved_by UUID REFERENCES users(id);
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS pao_approved_at TIMESTAMPTZ;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS decision_remarks TEXT;

CREATE TABLE IF NOT EXISTS issue_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  requisition_id UUID NOT NULL REFERENCES store_requisitions(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  model TEXT NOT NULL DEFAULT 'Model 20 (Preliminary)'
    CHECK (model IN ('Model 20 (Preliminary)', 'Model 22 (Final)')),
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  status TEXT NOT NULL DEFAULT 'Preliminary' CHECK (status IN ('Preliminary', 'Approved', 'Rejected', 'Issued')),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_remarks TEXT,
  finalized_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

-- Keep existing installations compatible with the explicit Model 20 approval state.
ALTER TABLE issue_vouchers DROP CONSTRAINT IF EXISTS issue_vouchers_status_check;
ALTER TABLE issue_vouchers ADD CONSTRAINT issue_vouchers_status_check
  CHECK (status IN ('Preliminary', 'Approved', 'Rejected', 'Issued'));
ALTER TABLE issue_vouchers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE issue_vouchers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE issue_vouchers ADD COLUMN IF NOT EXISTS approval_remarks TEXT;

CREATE TABLE IF NOT EXISTS gate_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_voucher_id UUID UNIQUE NOT NULL REFERENCES issue_vouchers(id),
  cleared_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  cleared_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Fixed Assets and User-Cards (User-Card is a computed view, see views.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  custodian_name TEXT NOT NULL,
  department TEXT NOT NULL,
  acquisition_date DATE NOT NULL,
  value NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Use'
    CHECK (status IN ('In Use', 'Transferred', 'Disposed')),
  goods_receipt_id UUID REFERENCES goods_receipts(id),
  registered_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixed_asset_custody_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  from_custodian_name TEXT,
  from_department TEXT,
  to_custodian_name TEXT NOT NULL,
  to_department TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asset_custody_history_asset
  ON fixed_asset_custody_history (fixed_asset_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS fixed_asset_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  verified_by UUID NOT NULL REFERENCES users(id),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('Verified', 'Exception')),
  remarks TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asset_verifications_asset
  ON fixed_asset_verifications (fixed_asset_id, verified_at DESC);

ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Store Return Notes (SRN)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_return_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  source_issue_voucher_id UUID REFERENCES issue_vouchers(id),
  returned_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Technical Evaluation'
    CHECK (status IN ('Pending Department Approval', 'Pending Technical Evaluation', 'Evaluated', 'Approved', 'Rejected')),
  condition TEXT CHECK (condition IN ('Serviceable', 'Damaged', 'Obsolete')),
  decided_by UUID REFERENCES users(id),
  department_approved_by UUID REFERENCES users(id),
  department_approved_at TIMESTAMPTZ,
  decision_remarks TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE store_return_notes DROP CONSTRAINT IF EXISTS store_return_notes_status_check;
ALTER TABLE store_return_notes ADD CONSTRAINT store_return_notes_status_check
  CHECK (status IN ('Pending Department Approval', 'Pending Technical Evaluation', 'Evaluated', 'Approved', 'Rejected'));
ALTER TABLE store_return_notes ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE store_return_notes ADD COLUMN IF NOT EXISTS department_approved_by UUID REFERENCES users(id);
ALTER TABLE store_return_notes ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMPTZ;
ALTER TABLE store_return_notes ADD COLUMN IF NOT EXISTS decision_remarks TEXT;
ALTER TABLE store_return_notes ADD COLUMN IF NOT EXISTS source_issue_voucher_id UUID REFERENCES issue_vouchers(id);

-- ---------------------------------------------------------------------------
-- Inter-Store Material Transfers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  from_store_id UUID NOT NULL REFERENCES stores(id),
  to_store_id UUID NOT NULL REFERENCES stores(id),
  status TEXT NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Pending Approval', 'Approved', 'Rejected')),
  requested_by UUID NOT NULL REFERENCES users(id),
  decided_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT from_to_different CHECK (from_store_id::text <> to_store_id::text)
);

-- ---------------------------------------------------------------------------
-- Disposal Workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disposal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no TEXT UNIQUE NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  fixed_asset_id UUID REFERENCES fixed_assets(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Disposal'
    CHECK (status IN ('Pending Disposal', 'Forwarded to Committee', 'Approved', 'Rejected', 'Disposed')),
  method TEXT CHECK (method IN ('Auction', 'Destruction', 'Donation', 'Write-off')),
  flagged_by UUID NOT NULL REFERENCES users(id),
  forwarded_by UUID REFERENCES users(id),
  forwarded_at TIMESTAMPTZ,
  review_notes TEXT,
  financial_write_off_amount NUMERIC(14, 2) CHECK (financial_write_off_amount >= 0),
  financial_write_off_by UUID REFERENCES users(id),
  financial_write_off_at TIMESTAMPTZ,
  financial_write_off_notes TEXT,
  decided_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS fixed_asset_id UUID REFERENCES fixed_assets(id);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS forwarded_by UUID REFERENCES users(id);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMPTZ;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS financial_write_off_amount NUMERIC(14, 2);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS financial_write_off_by UUID REFERENCES users(id);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS financial_write_off_at TIMESTAMPTZ;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS financial_write_off_notes TEXT;
ALTER TABLE disposal_requests DROP CONSTRAINT IF EXISTS disposal_requests_status_check;
ALTER TABLE disposal_requests ADD CONSTRAINT disposal_requests_status_check
  CHECK (status IN ('Pending Disposal', 'Forwarded to Committee', 'Approved', 'Rejected', 'Disposed'));

-- ---------------------------------------------------------------------------
-- Stock Taking and Reconciliation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  scheduled_by UUID NOT NULL REFERENCES users(id),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled', 'Counting', 'Counted', 'Reconciled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_take_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_take_id UUID NOT NULL REFERENCES stock_takes(id),
  item_id UUID NOT NULL REFERENCES items(id),
  system_qty NUMERIC(14, 2) NOT NULL,
  counted_qty NUMERIC(14, 2),
  counted_by UUID REFERENCES users(id),
  counted_at TIMESTAMPTZ,
  UNIQUE (stock_take_id, item_id)
);

CREATE TABLE IF NOT EXISTS reconciliation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_take_line_id UUID NOT NULL REFERENCES stock_take_lines(id),
  item_id UUID NOT NULL REFERENCES items(id),
  adjustment_qty NUMERIC(14, 2) NOT NULL, -- signed: counted - system
  finding TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Audit Log (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  role TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_hash TEXT,
  entry_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entry_hash TEXT;
DROP TRIGGER IF EXISTS trg_audit_log_append_only ON audit_logs;
DO $$
DECLARE
  audit_row RECORD;
  prior_hash TEXT := NULL;
  calculated_hash TEXT;
BEGIN
  FOR audit_row IN SELECT * FROM audit_logs ORDER BY created_at ASC, id ASC LOOP
    calculated_hash := encode(digest(
      COALESCE(prior_hash, '') || E'\\x1f' || COALESCE(audit_row.user_id::text, '') || E'\\x1f' ||
      audit_row.user_name || E'\\x1f' || COALESCE(audit_row.role, '') || E'\\x1f' ||
      audit_row.module || E'\\x1f' || audit_row.action || E'\\x1f' ||
      to_char(audit_row.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'sha256'
    ), 'hex');
    UPDATE audit_logs SET previous_hash = prior_hash, entry_hash = calculated_hash WHERE id = audit_row.id;
    prior_hash := calculated_hash;
  END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_store ON users (role, store_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department);
CREATE INDEX IF NOT EXISTS idx_stores_head ON stores (head_user_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_store_status ON goods_receipts (store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requisitions_store_status ON store_requisitions (store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requisitions_requester ON store_requisitions (requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_store_status ON issue_vouchers (store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_source_status ON store_return_notes (source_issue_voucher_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_requester ON store_return_notes (returned_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_store_status ON material_transfers (from_store_id, to_store_id, status);
CREATE INDEX IF NOT EXISTS idx_disposals_item_status ON disposal_requests (item_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_department_status ON fixed_assets (department, status);

-- Persistent in-app workflow notifications. Notifications are append-only
-- events with a per-recipient read marker.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT NOT NULL,
  reference_id UUID,
  severity TEXT NOT NULL DEFAULT 'Info' CHECK (severity IN ('Info', 'Success', 'Warning', 'Critical')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at DESC);

-- ============================================================================
-- Append-only enforcement triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_update_delete() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'This table is append-only: % on % is not permitted. Corrections must be new entries.', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_card_append_only ON stock_card_entries;
CREATE TRIGGER trg_stock_card_append_only
  BEFORE UPDATE OR DELETE ON stock_card_entries
  FOR EACH ROW EXECUTE FUNCTION reject_update_delete();

DROP TRIGGER IF EXISTS trg_bin_card_append_only ON bin_card_entries;
CREATE TRIGGER trg_bin_card_append_only
  BEFORE UPDATE OR DELETE ON bin_card_entries
  FOR EACH ROW EXECUTE FUNCTION reject_update_delete();

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON audit_logs;
CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION reject_update_delete();

DROP TRIGGER IF EXISTS trg_reconciliation_append_only ON reconciliation_entries;
CREATE TRIGGER trg_reconciliation_append_only
  BEFORE UPDATE OR DELETE ON reconciliation_entries
  FOR EACH ROW EXECUTE FUNCTION reject_update_delete();

-- ============================================================================
-- User-Card view: per-custodian fixed asset custody, computed on demand
-- (mirrors the "UserCard" entity in the specification without a separate
-- mutable table — it is always exactly consistent with fixed_assets).
-- ============================================================================
CREATE OR REPLACE VIEW user_cards_view AS
SELECT
  custodian_name,
  department,
  COUNT(*) AS asset_count,
  json_agg(json_build_object(
    'id', id,
    'tag', tag,
    'itemId', item_id,
    'acquisitionDate', acquisition_date,
    'value', value,
    'status', status
  ) ORDER BY acquisition_date DESC) AS assets
FROM fixed_assets
WHERE status IN ('In Use', 'Transferred')
GROUP BY custodian_name, department;

-- ============================================================================
-- Reorder / safety-stock alert view: computed on demand, not persisted,
-- so it can never go stale (Use Case: Monitor Reorder and Safety Stock Levels)
-- ============================================================================
DROP VIEW IF EXISTS reorder_alerts_view;
CREATE OR REPLACE VIEW reorder_alerts_view AS
SELECT
  id AS item_id,
  code,
  name,
  qty_on_hand,
  disposal_reserved_qty,
  (qty_on_hand - disposal_reserved_qty) AS usable_qty,
  reorder_level,
  safety_stock_level,
  CASE
    WHEN (qty_on_hand - disposal_reserved_qty) <= safety_stock_level THEN 'Safety Stock Breach'
    WHEN (qty_on_hand - disposal_reserved_qty) <= reorder_level THEN 'Reorder Level Reached'
    ELSE NULL
  END AS alert_level
FROM items
WHERE status = 'Active' AND (qty_on_hand - disposal_reserved_qty) <= reorder_level;

CREATE OR REPLACE VIEW shelf_life_alerts_view AS
WITH active_lots AS (
  SELECT item_id, MIN(expiry_date) AS next_expiry_date
  FROM cost_lots
  WHERE qty_remaining > 0 AND expiry_date IS NOT NULL
  GROUP BY item_id
), effective_expiry AS (
  SELECT i.id AS item_id, i.code, i.name, i.qty_on_hand,
         COALESCE(al.next_expiry_date, i.expiry_date) AS expiry_date
  FROM items i
  LEFT JOIN active_lots al ON al.item_id = i.id
  WHERE i.status = 'Active' AND i.qty_on_hand > 0
)
SELECT item_id, code, name, qty_on_hand, expiry_date,
       CASE
         WHEN expiry_date < CURRENT_DATE THEN 'Expired'
         WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Near-Expiry'
         ELSE 'Available'
       END AS alert_level,
       (expiry_date - CURRENT_DATE) AS days_until_expiry
FROM effective_expiry
WHERE expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '30 days';
