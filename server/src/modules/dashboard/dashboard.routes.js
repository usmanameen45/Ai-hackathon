import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getDashboardData } from "./dashboard.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", getDashboardData);

export default router;
