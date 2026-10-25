import { Router } from "express";
import userRoutes from "../modules/user/user.routes.js";
import orgRoutes from "../modules/organization/organization.routes.js";
import employeeRoutes from "../modules/employee/employee.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";
import commsRoutes from "../modules/comms/comms.routes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

router.use("/users", userRoutes);
router.use("/org", orgRoutes);
router.use("/employees", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leaves", leaveRoutes);
router.use("/payroll", payrollRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);
router.use("/comms", commsRoutes);

export default router;
