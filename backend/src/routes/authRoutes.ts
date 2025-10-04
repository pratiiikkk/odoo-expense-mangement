import { Router } from "express";
import { signup } from "../controllers/authController";

const router = Router();

// Custom signup with company creation
router.post("/signup", signup);

export default router;
