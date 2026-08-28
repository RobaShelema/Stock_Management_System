const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/transfers.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post("/", requireRole("Store Head", "Department Head"), asyncHandler(ctrl.create));
router.post(
  "/:id/decide",
  requireRole("Property Administration Officer"),
  asyncHandler(ctrl.decide)
);

module.exports = router;
