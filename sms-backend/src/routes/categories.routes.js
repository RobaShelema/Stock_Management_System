const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/categories.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post("/", requireRole("Administrator", "Store Head"), asyncHandler(ctrl.create));

module.exports = router;
