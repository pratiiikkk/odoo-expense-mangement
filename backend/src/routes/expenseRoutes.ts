import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import {
  submitExpense,
  getMyExpenses,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController";

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// Employee routes - Submit and view own expenses
router.post("/", submitExpense);
router.get("/my-expenses", getMyExpenses);

// Get all expenses (Manager/Admin)
router.get("/", requireRole("ADMIN", "MANAGER"), getAllExpenses);

// Get, update, delete specific expense
router.get("/:expenseId", getExpenseById);
router.put("/:expenseId", updateExpense);
router.delete("/:expenseId", deleteExpense);

export default router;
