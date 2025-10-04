import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";

/**
 * Get expenses pending approval for current user
 * GET /api/approvals/pending
 * Role: MANAGER, ADMIN
 */
export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  // Get all approval steps where current user is the approver
  const pendingSteps = await prisma.approvalStep.findMany({
    where: {
      approverId: req.user.id,
      status: "PENDING",
      expense: {
        companyId: req.user.companyId,
        status: "PENDING", // Only get expenses that are still pending
      },
    },
    include: {
      expense: {
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              baseCurrency: true,
            },
          },
          approvalSteps: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter to only show expenses where current step is for this approver
  const currentPendingApprovals = pendingSteps.filter((step: any) => {
    const expense = step.expense;
    // Check if this is the current approval step
    return step.sequence === expense.currentApprovalStep;
  });

  res.json({
    count: currentPendingApprovals.length,
    approvals: currentPendingApprovals.map((step: any) => ({
      approvalStepId: step.id,
      expense: {
        id: step.expense.id,
        amount: step.expense.amount,
        currency: step.expense.currency,
        category: step.expense.category,
        description: step.expense.description,
        date: step.expense.date,
        status: step.expense.status,
        employee: step.expense.employee,
        company: step.expense.company,
        createdAt: step.expense.createdAt,
      },
      currentStep: step.sequence,
      totalSteps: step.expense.approvalSteps.length,
      allApprovalSteps: step.expense.approvalSteps,
    })),
  });
});

/**
 * Approve an expense
 * POST /api/approvals/:approvalStepId/approve
 * Role: MANAGER, ADMIN
 */
export const approveExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { approvalStepId } = req.params;
  const { comments } = req.body;

  // Get the approval step
  const approvalStep = await prisma.approvalStep.findUnique({
    where: { id: approvalStepId },
    include: {
      expense: {
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              baseCurrency: true,
            },
          },
          approvalSteps: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });

  if (!approvalStep) {
    throw new AppError("Approval step not found", 404);
  }

  // Verify the approval step belongs to current user
  if (approvalStep.approverId !== req.user.id) {
    throw new AppError("You are not authorized to approve this expense", 403);
  }

  // Verify the approval step is pending
  if (approvalStep.status !== "PENDING") {
    throw new AppError("This approval step has already been processed", 400);
  }

  // Verify this is the current approval step
  if (approvalStep.sequence !== approvalStep.expense.currentApprovalStep) {
    throw new AppError("This is not the current approval step", 400);
  }

  // Update the approval step
  await prisma.approvalStep.update({
    where: { id: approvalStepId },
    data: {
      status: "APPROVED",
      comments: comments || null,
      actionDate: new Date(),
    },
  });

  // Check if there are more approval steps
  const nextStep = approvalStep.expense.approvalSteps.find(
    (step: any) => step.sequence === approvalStep.sequence + 1
  );

  if (nextStep) {
    // Move to next approval step
    await prisma.expense.update({
      where: { id: approvalStep.expense.id },
      data: {
        currentApprovalStep: nextStep.sequence,
      },
    });

    res.json({
      message: "Expense approved. Moved to next approver.",
      expenseStatus: "PENDING",
      nextApprover: nextStep.approver.name,
      currentStep: nextStep.sequence,
      totalSteps: approvalStep.expense.approvalSteps.length,
    });
  } else {
    // No more steps, check conditional approval rules
    const shouldAutoApprove = await checkConditionalApprovalRules(
      approvalStep.expense.id,
      approvalStep.expense.companyId
    );

    if (shouldAutoApprove) {
      // All approvals completed - approve expense
      await prisma.expense.update({
        where: { id: approvalStep.expense.id },
        data: {
          status: "APPROVED",
        },
      });

      res.json({
        message: "Expense fully approved!",
        expenseStatus: "APPROVED",
      });
    } else {
      res.json({
        message: "Expense approved by you. Waiting for conditional rules.",
        expenseStatus: "PENDING",
      });
    }
  }
});

/**
 * Reject an expense
 * POST /api/approvals/:approvalStepId/reject
 * Role: MANAGER, ADMIN
 */
export const rejectExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { approvalStepId } = req.params;
  const { comments } = req.body;

  if (!comments) {
    throw new AppError("Comments are required when rejecting an expense", 400);
  }

  // Get the approval step
  const approvalStep = await prisma.approvalStep.findUnique({
    where: { id: approvalStepId },
    include: {
      expense: true,
    },
  });

  if (!approvalStep) {
    throw new AppError("Approval step not found", 404);
  }

  // Verify the approval step belongs to current user
  if (approvalStep.approverId !== req.user.id) {
    throw new AppError("You are not authorized to reject this expense", 403);
  }

  // Verify the approval step is pending
  if (approvalStep.status !== "PENDING") {
    throw new AppError("This approval step has already been processed", 400);
  }

  // Verify this is the current approval step
  if (approvalStep.sequence !== approvalStep.expense.currentApprovalStep) {
    throw new AppError("This is not the current approval step", 400);
  }

  // Update the approval step
  await prisma.approvalStep.update({
    where: { id: approvalStepId },
    data: {
      status: "REJECTED",
      comments,
      actionDate: new Date(),
    },
  });

  // Reject the entire expense
  await prisma.expense.update({
    where: { id: approvalStep.expense.id },
    data: {
      status: "REJECTED",
    },
  });

  res.json({
    message: "Expense rejected",
    expenseStatus: "REJECTED",
  });
});

/**
 * Get approval history for an expense
 * GET /api/approvals/expense/:expenseId/history
 * Role: EMPLOYEE (own), MANAGER (team), ADMIN (all)
 */
export const getApprovalHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { expenseId } = req.params;

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      companyId: req.user.companyId,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvalSteps: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  // Authorization check
  if (req.user.role === "EMPLOYEE") {
    if (expense.employeeId !== req.user.id) {
      throw new AppError("You can only view approval history for your own expenses", 403);
    }
  } else if (req.user.role === "MANAGER") {
    const isOwnExpense = expense.employeeId === req.user.id;
    const isSubordinate = await prisma.user.findFirst({
      where: {
        id: expense.employeeId,
        managerId: req.user.id,
      },
    });

    if (!isOwnExpense && !isSubordinate) {
      throw new AppError("You can only view approval history for your team's expenses", 403);
    }
  }

  res.json({
    expenseId: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    status: expense.status,
    employee: expense.employee,
    currentStep: expense.currentApprovalStep,
    approvalHistory: expense.approvalSteps.map((step: any) => ({
      id: step.id,
      sequence: step.sequence,
      approver: step.approver,
      status: step.status,
      comments: step.comments,
      actionDate: step.actionDate,
      createdAt: step.createdAt,
    })),
  });
});

/**
 * Helper function to check conditional approval rules
 * Returns true if expense should be auto-approved based on rules
 */
async function checkConditionalApprovalRules(
  expenseId: string,
  companyId: string
): Promise<boolean> {
  // Get the expense with all approval steps
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      approvalSteps: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!expense) {
    return false;
  }

  // Get approval rules for this company
  const approvalRules = await prisma.approvalRule.findMany({
    where: {
      companyId,
      // Filter rules applicable to this expense amount
      OR: [
        { thresholdAmount: null }, // Rules without threshold apply to all
        { thresholdAmount: { lte: expense.amount } }, // Rules with threshold <= expense amount
      ],
    },
    orderBy: { sequence: "asc" },
  });

  // If no rules defined, require all approvals
  if (approvalRules.length === 0) {
    return expense.approvalSteps.every((step: any) => step.status === "APPROVED");
  }

  // Check each rule
  for (const rule of approvalRules) {
    if (rule.ruleType === "PERCENTAGE" && rule.approvalPercentage) {
      // Check if percentage of approvers have approved
      const totalApprovers = expense.approvalSteps.length;
      const approvedCount = expense.approvalSteps.filter(
        (step: any) => step.status === "APPROVED"
      ).length;
      const approvalPercentage = (approvedCount / totalApprovers) * 100;

      if (approvalPercentage >= rule.approvalPercentage) {
        return true; // Percentage rule satisfied
      }
    }

    if (rule.ruleType === "SPECIFIC" && rule.specificApproverId) {
      // Check if specific approver has approved
      const specificApproval = expense.approvalSteps.find(
        (step: any) => step.approverId === rule.specificApproverId
      );

      if (specificApproval && specificApproval.status === "APPROVED") {
        return true; // Specific approver rule satisfied
      }
    }

    if (rule.ruleType === "HYBRID") {
      // Check both percentage AND specific approver
      let percentageSatisfied = false;
      let specificApproverSatisfied = false;

      if (rule.approvalPercentage) {
        const totalApprovers = expense.approvalSteps.length;
        const approvedCount = expense.approvalSteps.filter(
          (step: any) => step.status === "APPROVED"
        ).length;
        const approvalPercentage = (approvedCount / totalApprovers) * 100;
        percentageSatisfied = approvalPercentage >= rule.approvalPercentage;
      }

      if (rule.specificApproverId) {
        const specificApproval = expense.approvalSteps.find(
          (step: any) => step.approverId === rule.specificApproverId
        );
        specificApproverSatisfied =
          specificApproval !== undefined && specificApproval.status === "APPROVED";
      }

      // In HYBRID mode, either condition satisfies the rule (OR logic)
      if (percentageSatisfied || specificApproverSatisfied) {
        return true;
      }
    }

    if (rule.ruleType === "SEQUENTIAL") {
      // For sequential, all steps must be approved
      const allApproved = expense.approvalSteps.every(
        (step: any) => step.status === "APPROVED"
      );
      if (allApproved) {
        return true;
      }
    }
  }

  // If no rules matched, check if all steps are approved
  return expense.approvalSteps.every((step: any) => step.status === "APPROVED");
}

/**
 * Get approval statistics for manager/admin dashboard
 * GET /api/approvals/stats
 * Role: MANAGER, ADMIN
 */
export const getApprovalStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  // Get pending approvals count
  const pendingCount = await prisma.approvalStep.count({
    where: {
      approverId: req.user.id,
      status: "PENDING",
      expense: {
        companyId: req.user.companyId,
        status: "PENDING",
      },
    },
  });

  // Get approved count (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const approvedThisMonth = await prisma.approvalStep.count({
    where: {
      approverId: req.user.id,
      status: "APPROVED",
      actionDate: {
        gte: startOfMonth,
      },
    },
  });

  // Get rejected count (this month)
  const rejectedThisMonth = await prisma.approvalStep.count({
    where: {
      approverId: req.user.id,
      status: "REJECTED",
      actionDate: {
        gte: startOfMonth,
      },
    },
  });

  res.json({
    pending: pendingCount,
    approvedThisMonth,
    rejectedThisMonth,
    totalProcessedThisMonth: approvedThisMonth + rejectedThisMonth,
  });
});
