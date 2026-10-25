import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  createPayrollDraft,
  listPayroll,
  finalizePayroll,
  getPayslip,
} from "./payroll.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole(["admin", "hr"]), createPayrollDraft);
router.get("/", requireRole(["admin", "hr"]), listPayroll);
router.patch("/:id/finalize", requireRole(["admin"]), finalizePayroll);
router.get("/payslip/:month", getPayslip);

export default router;
