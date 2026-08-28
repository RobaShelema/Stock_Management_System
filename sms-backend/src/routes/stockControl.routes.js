const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/stockControl.controller");

const router = express.Router();
router.use(authenticate);

router.get("/alerts", asyncHandler(ctrl.reorderAlerts));
router.get("/shelf-life-alerts", asyncHandler(ctrl.shelfLifeAlerts));

router.get("/stock-takes", asyncHandler(ctrl.listStockTakes));
router.post(
  "/stock-takes",
  requireRole("Property Administration Officer", "Administrator"),
  asyncHandler(ctrl.scheduleStockTake),
);
router.get("/stock-takes/:id", asyncHandler(ctrl.getStockTake));
router.post(
  "/stock-takes/:id/lines/:lineId/count",
  requireRole("Store Head", "Stock Clerk", "Administrator"),
  asyncHandler(ctrl.recordCount),
);
router.post(
  "/stock-takes/:id/reconcile",
  requireRole("Property Administration Officer", "Administrator"),
  asyncHandler(ctrl.reconcile),
);

router.get(
  "/valuation",
  requireRole("Accountant", "Property Administration Officer", "Administrator"),
  asyncHandler(ctrl.valuationReport),
);

module.exports = router;
