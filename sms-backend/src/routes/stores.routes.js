const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/stores.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post("/", requireRole("Administrator", "Property Administration Officer"), asyncHandler(ctrl.create));
router.put("/:id", requireRole("Administrator", "Property Administration Officer"), asyncHandler(ctrl.update));
router.post(
  "/:id/toggle-status",
  requireRole("Administrator", "Property Administration Officer"),
  asyncHandler(ctrl.toggleStatus)
);

module.exports = router;
