const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/returns.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post(
  "/",
  requireRole("Department Head", "Requesting Staff"),
  asyncHandler(ctrl.create),
);
router.post(
  "/:id/evaluate",
  requireRole("Technical Evaluation Committee"),
  asyncHandler(ctrl.evaluate),
);
router.post(
  "/:id/decide",
  requireRole(
    "Department Head",
    "Property Administration Officer",
    "Store Head",
  ),
  asyncHandler(ctrl.decide),
);

module.exports = router;
