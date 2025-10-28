const Employee = require("../model/employee");
const Department = require("../model/department");
const Designation = require("../model/designation");
const bcrypt = require("bcryptjs");

const employeeController = {
  // ➕ Create Employee
  createEmployee: async (req, res) => {
    try {
      const { name, email, password, department_id, designation_id, reporting_head_id, status } = req.body;

      if (!name || !email || !password || !department_id || !designation_id) {
        return res.status(400).json({ status: false, message: "All required fields must be provided" });
      }

      const existing = await Employee.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ status: false, message: "Employee with this email already exists" });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const newEmp = await Employee.create({
        name,
        email,
        password: hashPassword,
        department_id,
        designation_id,
        reporting_head_id,
        status,
      });

      res.status(201).json({ status: true, message: "Employee created successfully", data: newEmp });
    } catch (err) {
      console.error("Error creating employee:", err);
      res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
  },

  // 📜 Get all Employees with department & designation
  getAllEmployees: async (req, res) => {
    try {
      const employees = await Employee.findAll({
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Designation, as: "designation", attributes: ["id", "title"] },
          { model: Employee, as: "reporting_head", attributes: ["id", "name", "email"] },
        ],
      });
      res.status(200).json({ status: true, message: "Fetched successfully", data: employees });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // 🔍 Get by ID
  getEmployeeById: async (req, res) => {
    try {
      const { id } = req.params;
      const emp = await Employee.findByPk(id, {
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: Designation, as: "designation", attributes: ["id", "title"] },
          { model: Employee, as: "reporting_head", attributes: ["id", "name", "email"] },
        ],
      });

      if (!emp) {
        return res.status(404).json({ status: false, message: "Employee not found" });
      }

      res.status(200).json({ status: true, message: "Employee fetched successfully", data: emp });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ✏️ Update Employee
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, department_id, designation_id, reporting_head_id, status } = req.body;

      const emp = await Employee.findByPk(id);
      if (!emp) {
        return res.status(404).json({ status: false, message: "Employee not found" });
      }

      let hashPassword = emp.password;
      if (password) {
        hashPassword = await bcrypt.hash(password, 10);
      }

      await emp.update({
        name,
        email,
        password: hashPassword,
        department_id,
        designation_id,
        reporting_head_id,
        status,
      });

      res.status(200).json({ status: true, message: "Employee updated successfully", data: emp });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ❌ Delete Employee
  deleteEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const emp = await Employee.findByPk(id);
      if (!emp) {
        return res.status(404).json({ status: false, message: "Employee not found" });
      }

      await emp.destroy();
      res.status(200).json({ status: true, message: "Employee deleted successfully" });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },
};

module.exports = employeeController;
