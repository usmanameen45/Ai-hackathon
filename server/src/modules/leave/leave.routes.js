import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  applyLeave,
  listLeave,
  getBalance,
  updateLeaveStatus,
} from "./leave.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", applyLeave);
router.get("/", listLeave);
router.get("/balance", getBalance);
router.patch("/:id", requireRole(["admin", "hr"]), updateLeaveStatus);

export default router;
