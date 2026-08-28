const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/reports.controller");

const router = express.Router();
router.use(authenticate);

router.get(
  "/:type/:format",
  requireRole(
    "Property Administration Officer",
    "Accountant",
    "Store Head",
    "Administrator",
  ),
  asyncHandler(ctrl.exportReport),
);

router.get(
  "/:type",
  requireRole(
    "Property Administration Officer",
    "Accountant",
    "Store Head",
    "Administrator",
  ),
  asyncHandler(ctrl.generate),
);

module.exports = router;
