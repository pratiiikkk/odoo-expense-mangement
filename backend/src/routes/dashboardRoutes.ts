import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { getDashboardStats } from "../controllers/dashboardController";

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

export default router;
