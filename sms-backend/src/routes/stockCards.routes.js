const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const ctrl = require("../controllers/stockCards.controller");

const router = express.Router();
router.use(authenticate);

router.get("/:itemId", asyncHandler(ctrl.getForItem));

module.exports = router;
