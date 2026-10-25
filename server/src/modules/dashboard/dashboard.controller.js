import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";
import LeaveRequest from "../leave/leave.model.js";
import PayrollRun from "../payroll/payroll.model.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const role = req.auth.user.role;
    const todayStr = new Date().toISOString().split("T")[0];

    const totalHeadcount = await Employee.countDocuments({ status: "active" });
    const todayAttendance = await Attendance.find({ date: todayStr });

    const presentCount = todayAttendance.filter(a => a.status === "present").length;
    const lateCount = todayAttendance.filter(a => a.status === "late").length;
    const pendingLeaves = await LeaveRequest.countDocuments({ status: "pending" });

    if (role === "employee") {
      const employee = await Employee.findOne({ userId: req.auth.user.id });
      if (!employee) return res.json({ dashboard: {} });

      const empToday = todayAttendance.find(a => a.employeeId.toString() === employee._id.toString());
      const empLeaves = await LeaveRequest.find({ employeeId: employee._id, status: "approved" });
      const leaveUsed = empLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      return res.json({
        dashboard: {
          role: "employee",
          employee,
          todayStatus: empToday ? empToday.status : "not_checked_in",
          leaveBalance: 32 - leaveUsed, // default total quota
          lateCountToday: lateCount,
        },
      });
    }

    // HR & Admin dashboard
    const departments = await Employee.distinct("department");
    const headcountByDept = {};
    for (const d of departments) {
      headcountByDept[d] = await Employee.countDocuments({ department: d, status: "active" });
    }

    const latestPayroll = await PayrollRun.findOne().sort({ createdAt: -1 });
    const totalPayrollCost = latestPayroll ? latestPayroll.items.reduce((sum, i) => sum + i.gross, 0) : 0;
    const avgSalary = totalHeadcount > 0 ? totalPayrollCost / totalHeadcount : 0;

    res.json({
      dashboard: {
        role,
        headcount: totalHeadcount,
        present: presentCount,
        late: lateCount,
        pendingApprovals: pendingLeaves,
        headcountByDept,
        payrollCost: totalPayrollCost,
        avgSalary,
      },
    });
  } catch (error) {
    next(error);
  }
};
