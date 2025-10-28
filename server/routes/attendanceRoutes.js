const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const { verifyToken, isAdmin } = require("../controller/authController");

router.post("/", verifyToken, attendanceController.createAttendance);
router.get("/", verifyToken, isAdmin, attendanceController.getAllAttendance);
router.get("/:id", verifyToken, attendanceController.getAttendanceById);
router.put("/:id", verifyToken, isAdmin, attendanceController.updateAttendance);
router.delete("/:id", verifyToken, isAdmin, attendanceController.deleteAttendance);

module.exports = router;
