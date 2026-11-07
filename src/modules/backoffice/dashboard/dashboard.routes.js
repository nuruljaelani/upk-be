import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();

// GET /api/bo/dashboard
router.get("/", DashboardController.getDashboard);

export default router;
