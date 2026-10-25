import LeaveRequest from "./leave.model.js";
import Employee from "../employee/employee.model.js";
import Organization from "../organization/organization.model.js";
import { ApiError } from "../../utils/ApiError.js";

const countWorkingDays = (start, end, weekends, holidays) => {
  let count = 0;
  let curr = new Date(start);
  const last = new Date(end);
  const holidayDates = new Set(holidays.map(h => new Date(h.date).toISOString().split("T")[0]));

  while (curr <= last) {
    const dayOfWeek = curr.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = curr.toISOString().split("T")[0];

    if (!weekends.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return count > 0 ? count : 1;
};

export const applyLeave = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.auth.user.id });
    if (!employee) return next(new ApiError(404, "Employee record not found"));

    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return next(new ApiError(400, "Missing required leave fields"));
    }

    const org = await Organization.findOne();
    const weekends = org?.weekends || ["Saturday", "Sunday"];
    const holidays = org?.holidays || [];

    const daysCount = countWorkingDays(startDate, endDate, weekends, holidays);

    // Check overlaps
    const existing = await LeaveRequest.findOne({
      employeeId: employee._id,
      status: { $ne: "rejected" },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });
    if (existing) {
      return next(new ApiError(422, "Overlapping leave request exists"));
    }

    // Check quota if not unpaid
    if (leaveType !== "Unpaid") {
      const quotaObj = org?.leaveTypes?.find(l => l.name.toLowerCase() === leaveType.toLowerCase());
      const maxQuota = quotaObj ? quotaObj.quota : (leaveType === "Annual" ? 14 : leaveType === "Sick" ? 8 : 10);

      const approvedLeaves = await LeaveRequest.find({
        employeeId: employee._id,
        leaveType,
        status: "approved",
      });
      const usedDays = approvedLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      if (usedDays + daysCount > maxQuota) {
        return next(new ApiError(422, `Leave quota exceeded. Available: ${maxQuota - usedDays}, Requested: ${daysCount}`));
      }
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
    });

    res.status(201).json({ message: "Leave applied successfully", leaveRequest });
  } catch (error) {
    next(error);
  }
};

export const listLeave = async (req, res, next) => {
  try {
    const query = {};
    if (req.auth.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.auth.user.id });
      if (!emp) return res.json({ leaves: [] });
      query.employeeId = emp._id;
    }

    const leaves = await LeaveRequest.find(query)
      .populate("employeeId", "name employeeId department designation")
      .sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    next(error);
  }
};

export const getBalance = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.auth.user.id });
    if (!employee) return next(new ApiError(404, "Employee record not found"));

    const org = await Organization.findOne();
    const leaveTypes = org?.leaveTypes || [
      { name: "Annual", quota: 14 },
      { name: "Sick", quota: 8 },
      { name: "Casual", quota: 10 },
    ];

    const balances = [];
    for (const lt of leaveTypes) {
      const approved = await LeaveRequest.find({
        employeeId: employee._id,
        leaveType: lt.name,
        status: "approved",
      });
      const used = approved.reduce((sum, l) => sum + l.daysCount, 0);
      balances.push({
        leaveType: lt.name,
        quota: lt.quota,
        used,
        remaining: lt.quota - used,
      });
    }

    res.json({ balances });
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // approved / rejected

    const leave = await LeaveRequest.findById(id);
    if (!leave) return next(new ApiError(404, "Leave request not found"));

    leave.status = status;
    leave.comment = comment || "";
    await leave.save();

    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    next(error);
  }
};
