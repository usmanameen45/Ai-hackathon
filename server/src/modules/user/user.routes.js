import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getMe } from "./user.controller.js";

const router = Router();

router.get("/me", requireAuth, getMe);

export default router;
