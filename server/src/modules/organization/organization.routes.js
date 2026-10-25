import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/rbac.js";
import {
  getOrganization,
  setupOrganization,
  updateSettings,
} from "./organization.controller.js";

const router = Router();

router.get("/", getOrganization); // Public check for first run
router.post("/setup", setupOrganization); // First run setup
router.patch("/", requireAuth, requireRole("admin"), updateSettings);

export default router;
