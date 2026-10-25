import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  listEmployees,
  getEmployee,
  registerEmployee,
  updateEmployee,
  csvImport,
} from "./employee.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.post("/", requireRole(["admin", "hr"]), registerEmployee);
router.put("/:id", updateEmployee);
router.post("/import", requireRole(["admin", "hr"]), csvImport);

export default router;
