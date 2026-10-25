import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  checkIn,
  checkOut,
  listAttendance,
  requestCorrection,
  approveCorrection,
} from "./attendance.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/", listAttendance);
router.post("/:id/correction", requestCorrection);
router.patch("/:id/correction", requireRole(["admin", "hr"]), approveCorrection);

export default router;
