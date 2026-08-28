const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/issueVouchers.controller");

const router = express.Router();
router.use(authenticate);

router.get(
  "/",
  requireRole(
    "Store Head",
    "Stock Clerk",
    "Requesting Staff",
    "Property Administration Officer",
    "Department Head",
    "Campus Security Officer",
  ),
  asyncHandler(ctrl.list),
);
router.post(
  "/:id/gate-clearance",
  requireRole("Campus Security Officer"),
  asyncHandler(ctrl.recordGateClearance),
);
router.post(
  "/preliminary",
  requireRole("Store Head"),
  asyncHandler(ctrl.createPreliminary),
);
router.post(
  "/:id/amend",
  requireRole("Property Administration Officer", "Department Head"),
  asyncHandler(ctrl.amend),
);
router.post(
  "/:id/approve",
  requireRole("Property Administration Officer", "Department Head"),
  asyncHandler(ctrl.approve),
);
router.post(
  "/:id/finalize",
  requireRole("Store Head"),
  asyncHandler(ctrl.finalize),
);

module.exports = router;
