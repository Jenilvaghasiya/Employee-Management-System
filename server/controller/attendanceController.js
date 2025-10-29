const Attendance = require("../model/attendance");
const Employee = require("../model/employee");

const attendanceController = {
  // ✅ Create Attendance
  createAttendance: async (req, res) => {
    try {
      const { employee_id, date, sign_in_time, sign_out_time, status } = req.body;

      // Validation
      if (!employee_id || !date) {
        return res.status(400).json({
          status: false,
          message: "Employee ID and Date are required",
        });
      }

      const employeeExists = await Employee.findByPk(employee_id);
      if (!employeeExists) {
        return res.status(404).json({
          status: false,
          message: "Employee not found",
        });
      }

      // ✅ Convert to proper datetime
      const formattedSignIn = sign_in_time ? new Date(`${date}T${sign_in_time}`) : null;
      const formattedSignOut = sign_out_time ? new Date(`${date}T${sign_out_time}`) : null;

      const newAttendance = await Attendance.create({
        employee_id,
        date,
        sign_in_time: formattedSignIn,
        sign_out_time: formattedSignOut,
        status,
      });

      res.status(201).json({
        status: true,
        message: "Attendance record created successfully",
        data: newAttendance,
      });
    } catch (err) {
      console.error("Error creating attendance:", err);
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ✅ Get All Attendance
  getAllAttendance: async (req, res) => {
    try {
      const records = await Attendance.findAll({
        include: [
          { model: Employee, as: "employee", attributes: ["id", "name", "email"] },
        ],
        order: [["date", "DESC"]],
      });

      res.status(200).json({
        status: true,
        message: "Attendance fetched successfully",
        data: records,
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ✅ Get Single Attendance by ID
  getAttendanceById: async (req, res) => {
    try {
      const { id } = req.params;
      const record = await Attendance.findByPk(id, {
        include: [
          { model: Employee, as: "employee", attributes: ["id", "name", "email"] },
        ],
      });

      if (!record) {
        return res.status(404).json({
          status: false,
          message: "Attendance record not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Attendance fetched successfully",
        data: record,
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ✅ Update Attendance
  updateAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      const { employee_id, date, sign_in_time, sign_out_time, status } = req.body;

      const record = await Attendance.findByPk(id);
      if (!record) {
        return res.status(404).json({
          status: false,
          message: "Attendance not found",
        });
      }

      const formattedSignIn = sign_in_time ? new Date(`${date}T${sign_in_time}`) : null;
      const formattedSignOut = sign_out_time ? new Date(`${date}T${sign_out_time}`) : null;

      await record.update({
        employee_id,
        date,
        sign_in_time: formattedSignIn,
        sign_out_time: formattedSignOut,
        status,
      });

      res.status(200).json({
        status: true,
        message: "Attendance updated successfully",
        data: record,
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  // ✅ Delete Attendance
  deleteAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      const record = await Attendance.findByPk(id);

      if (!record) {
        return res.status(404).json({
          status: false,
          message: "Attendance not found",
        });
      }

      await record.destroy();

      res.status(200).json({
        status: true,
        message: "Attendance deleted successfully",
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },
};

module.exports = attendanceController;
