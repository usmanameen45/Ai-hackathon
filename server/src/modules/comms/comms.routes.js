import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  getAnnouncements,
  postAnnouncement,
  getNotifications,
  markNotificationRead,
  getAuditLogs,
} from "./comms.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/announcements", getAnnouncements);
router.post("/announcements", requireRole(["admin", "hr"]), postAnnouncement);
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.get("/audit", requireRole(["admin"]), getAuditLogs);

export default router;
