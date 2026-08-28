const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/binCards.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id/entries", asyncHandler(ctrl.getEntries));
router.post(
  "/transfer",
  requireRole("Store Head", "Stock Clerk", "Administrator"),
  asyncHandler(ctrl.transferBetweenBins)
);

module.exports = router;
