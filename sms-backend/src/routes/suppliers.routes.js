const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/suppliers.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
// Suppliers are records only; these routes are operated by internal staff.
router.post(
  "/",
  requireRole("Administrator", "Property Administration Officer", "Store Head"),
  asyncHandler(ctrl.create),
);
router.put(
  "/:id",
  requireRole("Administrator", "Property Administration Officer", "Store Head"),
  asyncHandler(ctrl.update),
);
router.post(
  "/:id/toggle-status",
  requireRole("Administrator", "Property Administration Officer"),
  asyncHandler(ctrl.toggleStatus),
);

module.exports = router;
