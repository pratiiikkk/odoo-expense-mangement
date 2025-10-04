import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import {
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  getApprovalHistory,
  getApprovalStats,
} from "../controllers/approvalController";

const router = Router();

// All approval routes require authentication and Manager/Admin role
router.use(requireAuth);
router.use(requireRole("MANAGER", "ADMIN"));

// Get pending approvals for current user
router.get("/pending", getPendingApprovals);

// Get approval statistics
router.get("/stats", getApprovalStats);

// Get approval history for an expense (accessible to employee too)
router.get("/expense/:expenseId/history", getApprovalHistory);

// Approve/Reject approval steps
router.post("/:approvalStepId/approve", approveExpense);
router.post("/:approvalStepId/reject", rejectExpense);

export default router;
