import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { aiChat, dashboardSummary, smartLeave } from "./ai.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/chat", aiChat);
router.post("/summary", dashboardSummary);
router.post("/smart-leave", smartLeave);

export default router;
