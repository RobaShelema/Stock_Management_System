const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/auditLogs.controller");

const router = express.Router();
router.use(authenticate);

router.get(
  "/verify",
  requireRole("Administrator", "Property Administration Officer"),
  asyncHandler(ctrl.verifyChain),
);
router.get(
  "/",
  requireRole("Administrator", "Property Administration Officer"),
  asyncHandler(ctrl.list),
);

module.exports = router;
