import Attendance from "./attendance.model.js";
import Employee from "../employee/employee.model.js";
import Organization from "../organization/organization.model.js";
import { ApiError } from "../../utils/ApiError.js";

const getTodayDateStr = () => new Date().toISOString().split("T")[0];

export const checkIn = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.auth.user.id });
    if (!employee) return next(new ApiError(404, "Employee record not found"));

    const date = getTodayDateStr();
    const existing = await Attendance.findOne({ employeeId: employee._id, date });
    if (existing) {
      return next(new ApiError(409, "Already checked in today"));
    }

    const org = await Organization.findOne();
    const now = new Date();
    const [startHour, startMin] = (org?.officeHours?.start || "09:00").split(":").map(Number);
    const graceTime = org?.graceTime || 15;

    const graceLimit = new Date(now);
    graceLimit.setHours(startHour, startMin + graceTime, 0, 0);

    const isLate = now > graceLimit;
    const status = isLate ? "late" : "present";

    const { source = "web", location } = req.body;

    const attendance = await Attendance.create({
      employeeId: employee._id,
      date,
      checkInTime: now,
      status,
      source,
      location: location || {},
    });

    res.status(201).json({ message: "Checked in successfully", attendance });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.auth.user.id });
    if (!employee) return next(new ApiError(404, "Employee record not found"));

    const date = getTodayDateStr();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date });
    if (!attendance) {
      return next(new ApiError(400, "No check-in record found for today"));
    }
    if (attendance.checkOutTime) {
      return next(new ApiError(400, "Already checked out today"));
    }

    const now = new Date();
    attendance.checkOutTime = now;

    // Check hours worked for half-day (< 5 hours)
    const hoursWorked = (now - new Date(attendance.checkInTime)) / (1000 * 60 * 60);
    if (hoursWorked < 5) {
      attendance.status = "half_day";
    }

    await attendance.save();
    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    next(error);
  }
};

export const listAttendance = async (req, res, next) => {
  try {
    const { date, department, employeeId } = req.query;
    const query = {};

    if (req.auth.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.auth.user.id });
      if (!emp) return res.json({ attendance: [] });
      query.employeeId = emp._id;
    } else {
      if (employeeId) query.employeeId = employeeId;
      if (department) {
        const emps = await Employee.find({ department }).select("_id");
        query.employeeId = { $in: emps.map(e => e._id) };
      }
    }

    if (date) query.date = date;

    const records = await Attendance.find(query)
      .populate("employeeId", "name employeeId department designation")
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    res.json({ attendance: records });
  } catch (error) {
    next(error);
  }
};

export const requestCorrection = async (req, res, next) => {
  try {
    const { id } = req.params; // attendance record ID
    const { reason } = req.body;

    const record = await Attendance.findById(id);
    if (!record) return next(new ApiError(404, "Attendance record not found"));

    record.correctionRequested = true;
    record.correctionReason = reason;
    record.correctionStatus = "pending";
    await record.save();

    res.json({ message: "Correction requested successfully", attendance: record });
  } catch (error) {
    next(error);
  }
};

export const approveCorrection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // status: approved / rejected

    const record = await Attendance.findById(id);
    if (!record) return next(new ApiError(404, "Attendance record not found"));

    record.correctionStatus = status;
    record.correctionComment = comment || "";
    if (status === "approved") {
      record.status = "present";
    }
    await record.save();

    res.json({ message: `Correction ${status}`, attendance: record });
  } catch (error) {
    next(error);
  }
};
