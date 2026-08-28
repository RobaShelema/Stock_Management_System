const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/items.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post("/", requireRole("Administrator", "Property Registration Officer"), asyncHandler(ctrl.create));

module.exports = router;
