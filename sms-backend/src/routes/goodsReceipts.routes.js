const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/goodsReceipts.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post(
  "/",
  requireRole(
    "Store Head",
    "Stock Clerk",
    "Property Administration Officer",
    "Administrator",
  ),
  asyncHandler(ctrl.create),
);
router.post(
  "/:id/evaluate",
  requireRole("Technical Evaluation Committee", "Administrator"),
  asyncHandler(ctrl.evaluate),
);
router.post(
  "/:id/generate-grn",
  requireRole("Property Registration Officer"),
  asyncHandler(ctrl.generateGrn),
);

module.exports = router;
