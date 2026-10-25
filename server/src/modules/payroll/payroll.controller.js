import PayrollRun from "./payroll.model.js";
import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";
import LeaveRequest from "../leave/leave.model.js";
import { ApiError } from "../../utils/ApiError.js";

const calculateTax = (annualGross) => {
  if (annualGross <= 600000) return 0;
  if (annualGross <= 1200000) return (annualGross - 600000) * 0.05;
  if (annualGross <= 2400000) return 30000 + (annualGross - 1200000) * 0.15;
  if (annualGross <= 3600000) return 210000 + (annualGross - 2400000) * 0.25;
  return 510000 + (annualGross - 3600000) * 0.35;
};

export const createPayrollDraft = async (req, res, next) => {
  try {
    const { month, department } = req.body; // YYYY-MM
    if (!month) return next(new ApiError(400, "Month is required"));

    const existing = await PayrollRun.findOne({ month, status: "finalized" });
    if (existing) return next(new ApiError(400, "Payroll for this month is already finalized and locked"));

    const query = { status: "active" };
    if (department && department !== "All") query.department = department;

    const employees = await Employee.find(query);
    const workingDays = 22; // standard working days in a month
    const items = [];

    for (const emp of employees) {
      const basic = emp.salary?.basic || 50000;
      const gross = basic * 1.5; // Gross = 1.5 * basic
      const perDay = gross / workingDays;

      // Count absences and half days for the month
      const attendanceRecords = await Attendance.find({
        employeeId: emp._id,
        date: new RegExp(`^${month}`),
      });

      const absentDays = attendanceRecords.filter(a => a.status === "absent").length;
      const halfDays = attendanceRecords.filter(a => a.status === "half_day").length;

      // Count approved unpaid leaves
      const unpaidLeaves = await LeaveRequest.find({
        employeeId: emp._id,
        leaveType: "Unpaid",
        status: "approved",
        startDate: new RegExp(`^${month}`),
      });
      const unpaidDays = unpaidLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      const deductions = (absentDays + unpaidDays) * perDay + halfDays * (perDay * 0.5);
      const taxableGross = Math.max(0, gross - deductions);
      const annualTax = calculateTax(taxableGross * 12);
      const tax = annualTax / 12;

      const net = Math.max(0, taxableGross - tax);

      items.push({
        employeeId: emp._id,
        basic,
        gross,
        deductions,
        tax,
        net,
        daysWorked: workingDays - absentDays - unpaidDays - (halfDays * 0.5),
        absentDays: absentDays + unpaidDays,
        halfDays,
      });
    }

    const payrollRun = await PayrollRun.findOneAndUpdate(
      { month },
      { month, department: department || "All", items, status: "draft" },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: "Payroll draft generated", payrollRun });
  } catch (error) {
    next(error);
  }
};

export const listPayroll = async (req, res, next) => {
  try {
    const runs = await PayrollRun.find().populate("items.employeeId", "name employeeId department designation").sort({ month: -1 });
    res.json({ payrollRuns: runs });
  } catch (error) {
    next(error);
  }
};

export const finalizePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) return next(new ApiError(404, "Payroll run not found"));

    if (run.status === "finalized") return next(new ApiError(400, "Already finalized"));

    run.status = "finalized";
    run.finalizedBy = req.auth.user.email;
    run.finalizedAt = new Date();
    await run.save();

    res.json({ message: "Payroll finalized and locked successfully", payrollRun: run });
  } catch (error) {
    next(error);
  }
};

export const getPayslip = async (req, res, next) => {
  try {
    const { month } = req.params;
    const employee = await Employee.findOne({ userId: req.auth.user.id });
    if (!employee) return next(new ApiError(404, "Employee record not found"));

    const run = await PayrollRun.findOne({ month, status: "finalized" });
    if (!run) return next(new ApiError(404, "Payslip not available or payroll not finalized"));

    const item = run.items.find(i => i.employeeId.toString() === employee._id.toString());
    if (!item && req.auth.user.role === "employee") {
      return next(new ApiError(404, "Payslip record not found for this employee"));
    }

    res.json({ payslip: { month, employee, item } });
  } catch (error) {
    next(error);
  }
};
