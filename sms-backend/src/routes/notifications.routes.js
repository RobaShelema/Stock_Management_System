const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const ctrl = require("../controllers/notifications.controller");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(ctrl.list));
router.post("/:id/read", asyncHandler(ctrl.markRead));
router.post("/read-all", asyncHandler(ctrl.markAllRead));

module.exports = router;
