import { Router } from "express";
import {
  getApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
  getEligibleApprovers,
} from "../controllers/approvalRuleController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

// All approval rule routes require ADMIN role
router.use(requireAuth);
router.use(requireRole("ADMIN"));

// Get all approval rules
router.get("/", getApprovalRules);

// Get eligible approvers
router.get("/eligible-approvers", getEligibleApprovers);

// Create approval rule
router.post("/", createApprovalRule);

// Update approval rule
router.put("/:ruleId", updateApprovalRule);

// Delete approval rule
router.delete("/:ruleId", deleteApprovalRule);

export default router;
