const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/fixedAssets.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.get("/user-cards", asyncHandler(ctrl.userCards));
router.get("/:id/history", asyncHandler(ctrl.history));
router.post(
  "/",
  requireRole("Property Registration Officer", "Administrator"),
  asyncHandler(ctrl.create),
);
router.post(
  "/:id/reassign",
  requireRole("Property Registration Officer", "Administrator"),
  asyncHandler(ctrl.reassign),
);
router.post(
  "/:id/verify",
  requireRole(
    "Property Registration Officer",
    "Department Head",
    "Administrator",
  ),
  asyncHandler(ctrl.verify),
);

module.exports = router;
