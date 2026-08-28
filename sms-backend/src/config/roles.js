// Central role list and per-action permission map, mirroring Section 4
// (Actors and What Each Can Do) of the Build Specification. Route middleware
// (`requireRole`) references this only for documentation/consistency; the
// actual enforcement is the explicit role list passed to each route.

const ROLES = [
  "Administrator",
  "Property Administration Officer",
  "Store Head",
  "Stock Clerk",
  "Technical Evaluation Committee",
  "Property Registration Officer",
  "Department Head",
  "Requesting Staff",
  "Accountant",
  "Disposal Committee",
  "Campus Security Officer",
];

// Roles that may perform first-line store operations (receipts, bin
// management, voucher issuing).
const STORE_OPERATIONS_ROLES = ["Store Head", "Stock Clerk"];

// Roles permitted to approve/reject at the "senior" gate (requisitions,
// returns, transfers).
const SENIOR_APPROVER_ROLES = ["Property Administration Officer"];

// Roles responsible for ICT system configuration, accounts, technical integrity, and backups.
const SYSTEM_ADMIN_ROLES = ["Administrator"];

module.exports = {
  ROLES,
  STORE_OPERATIONS_ROLES,
  SENIOR_APPROVER_ROLES,
  SYSTEM_ADMIN_ROLES,
};
