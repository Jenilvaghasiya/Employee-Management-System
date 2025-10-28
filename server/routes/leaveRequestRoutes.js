const express = require("express");
const router = express.Router();
const leaveRequestController = require("../controller/leaveRequestController");

router.post("/", leaveRequestController.createRequest);
router.get("/", leaveRequestController.getAllRequests);
router.get("/:id", leaveRequestController.getById);
router.put("/:id", leaveRequestController.updateRequest);
router.delete("/:id", leaveRequestController.deleteRequest);

module.exports = router;
