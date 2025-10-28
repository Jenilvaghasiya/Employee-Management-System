const LeaveRequest = require("../model/leaveRequest");
const Employee = require("../model/employee");
const LeaveType = require("../model/leaveType");

const leaveRequestController = {
  createRequest: async (req, res) => {
    try {
      const { employee_id, leave_type_id, start_date, end_date, is_half_day, status } = req.body;

      if (!employee_id || !leave_type_id || !start_date || !end_date) {
        return res.status(400).json({ status: false, message: "Required fields missing" });
      }

      const leaveRequest = await LeaveRequest.create({
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        is_half_day,
        status,
      });

      res.status(201).json({
        status: true,
        message: "Leave request submitted successfully",
        data: leaveRequest,
      });
    } catch (err) {
      console.error("Error creating leave request:", err);
      res.status(500).json({ status: false, message: err.message });
    }
  },

  getAllRequests: async (req, res) => {
    try {
      const requests = await LeaveRequest.findAll({
        include: [
          { model: Employee, as: "employee", attributes: ["id", "name", "email"] },
          { model: LeaveType, as: "leaveType", attributes: ["id", "name", "is_paid"] },
          { model: Employee, as: "approver", attributes: ["id", "name"] },
        ],
      });
      res.status(200).json({ status: true, message: "Leave requests fetched", data: requests });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const request = await LeaveRequest.findByPk(id, {
        include: [
          { model: Employee, as: "employee", attributes: ["id", "name", "email"] },
          { model: LeaveType, as: "leaveType", attributes: ["id", "name"] },
          { model: Employee, as: "approver", attributes: ["id", "name"] },
        ],
      });

      if (!request) {
        return res.status(404).json({ status: false, message: "Leave request not found" });
      }

      res.status(200).json({ status: true, message: "Leave request fetched", data: request });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  updateRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { leave_status, approved_by, start_date, end_date, is_half_day, status } = req.body;

      const request = await LeaveRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({ status: false, message: "Leave request not found" });
      }

      await request.update({
        leave_status,
        approved_by,
        start_date,
        end_date,
        is_half_day,
        status,
      });

      res.status(200).json({ status: true, message: "Leave request updated successfully", data: request });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const request = await LeaveRequest.findByPk(id);

      if (!request) {
        return res.status(404).json({ status: false, message: "Leave request not found" });
      }

      await request.destroy();
      res.status(200).json({ status: true, message: "Leave request deleted successfully" });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  },
};

module.exports = leaveRequestController;
