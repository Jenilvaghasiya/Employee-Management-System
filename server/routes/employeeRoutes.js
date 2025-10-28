const express = require("express");
const router = express.Router();
const employeeController = require("../controller/employeeController");
const { verifyToken, isAdmin } = require("../controller/authController");

// Admin protected routes
router.post("/", verifyToken, isAdmin, employeeController.createEmployee);
router.get("/", verifyToken, isAdmin, employeeController.getAllEmployees);
router.get("/:id", verifyToken, employeeController.getEmployeeById);
router.put("/:id", verifyToken, isAdmin, employeeController.updateEmployee);
router.delete("/:id", verifyToken, isAdmin, employeeController.deleteEmployee);

module.exports = router;
