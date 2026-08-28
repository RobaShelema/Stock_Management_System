const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/system.controller");

const router = express.Router();
router.use(authenticate);

// System health and status
router.get("/health", requireRole("Administrator"), asyncHandler(ctrl.getHealth));

// On-demand data backup trigger
router.post("/backup", requireRole("Administrator"), asyncHandler(ctrl.triggerBackup));

// System-wide configuration settings
router.get("/settings", requireRole("Administrator"), asyncHandler(ctrl.getSettings));
router.put("/settings", requireRole("Administrator"), asyncHandler(ctrl.updateSettings));

module.exports = router;
