const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/disposal.controller");

const router = express.Router();
router.use(authenticate);

router.get(
  "/",
  requireRole(
    "Store Head",
    "Technical Evaluation Committee",
    "Property Administration Officer",
    "Disposal Committee",
    "Accountant",
  ),
  asyncHandler(ctrl.list),
);
router.post(
  "/",
  requireRole("Store Head", "Technical Evaluation Committee"),
  asyncHandler(ctrl.flag),
);
router.post(
  "/:id/forward",
  requireRole("Property Administration Officer"),
  asyncHandler(ctrl.forward),
);
router.post(
  "/:id/decide",
  requireRole("Disposal Committee"),
  asyncHandler(ctrl.decide),
);
router.post(
  "/:id/write-off",
  requireRole("Accountant"),
  asyncHandler(ctrl.recordFinancialWriteOff),
);

module.exports = router;
