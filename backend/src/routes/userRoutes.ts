import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import {
  getMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";

const router = Router();

// Get current user
router.get("/me", requireAuth, getMe);

// Get all users (Admin and Manager only)
router.get("/", requireAuth, requireRole("ADMIN", "MANAGER"), getUsers);

// Create user (Admin only)
router.post("/", requireAuth, requireRole("ADMIN"), createUser);

// Update user (Admin only)
router.put("/:userId", requireAuth, requireRole("ADMIN"), updateUser);

// Delete user (Admin only)
router.delete("/:userId", requireAuth, requireRole("ADMIN"), deleteUser);

export default router;
