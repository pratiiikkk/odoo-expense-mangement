import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { convertCurrency } from "../services/currencyService";

/**
 * Helper function to generate approval steps based on approval rules
 */
async function generateApprovalSteps(
  expenseId: string,
  expenseAmount: number,
  employeeId: string,
  companyId: string
) {
  // Get employee with manager
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { managerId: true },
  });

  // Get matching approval rules for this company
  const rules = await prisma.approvalRule.findMany({
    where: {
      companyId,
      OR: [
        { thresholdAmount: null }, // Rules that apply to all amounts
        { thresholdAmount: { lte: expenseAmount } }, // Rules where expense meets threshold
      ],
    },
    orderBy: { sequence: "asc" },
  });

  if (rules.length === 0) {
    // No rules configured - use default manager approval if available
    if (employee?.managerId) {
      await prisma.approvalStep.create({
        data: {
          expenseId,
          approverId: employee.managerId,
          sequence: 1,
          status: "PENDING",
        },
      });
      return 1; // Return current approval step
    }
    return 0; // No approval needed
  }

  // Generate approval steps based on the first matching rule
  // In a more complex system, you might want to combine multiple rules
  const rule = rules[0];
  let currentSequence = 1;

  // Step 1: Manager approval if required
  if (rule.isManagerApprover && employee?.managerId) {
    await prisma.approvalStep.create({
      data: {
        expenseId,
        approverId: employee.managerId,
        sequence: currentSequence,
        status: "PENDING",
      },
    });
    currentSequence++;
  }

  // Step 2: Handle SPECIFIC approver
  if (rule.ruleType === "SPECIFIC" && rule.specificApproverId) {
    await prisma.approvalStep.create({
      data: {
        expenseId,
        approverId: rule.specificApproverId,
        sequence: currentSequence,
        status: "PENDING",
      },
    });
    currentSequence++;
  }

  // Step 3: Additional approvers based on rule type
  // For SEQUENTIAL and PERCENTAGE rules with multiple approvers,
  // they would need to be stored in a separate junction table (RuleApprovers)
  // This is a simplified implementation

  return currentSequence > 1 ? 1 : 0; // Return first step or 0 if no steps
}

/**
 * Submit a new expense
 * POST /api/expenses
 * Role: EMPLOYEE, MANAGER, ADMIN
 */
export const submitExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { amount, currency, category, description, date } = req.body;

  // Validate required fields
  if (!amount || !currency || !category || !date) {
    throw new AppError("Amount, currency, category, and date are required", 400);
  }

  // Validate amount is positive
  if (amount <= 0) {
    throw new AppError("Amount must be greater than 0", 400);
  }

  // Get user's company to check for currency
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { company: true },
  });

  if (!user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  // Create expense
  const expense = await prisma.expense.create({
    data: {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      category,
      description: description || "",
      date: new Date(date),
      employeeId: req.user.id,
      companyId: user.companyId,
      status: "PENDING",
      currentApprovalStep: 0,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          baseCurrency: true,
        },
      },
    },
  });

  // Generate approval steps based on approval rules
  const currentStep = await generateApprovalSteps(
    expense.id,
    expense.amount,
    req.user.id,
    user.companyId
  );

  // Update expense current approval step
  if (currentStep > 0) {
    await prisma.expense.update({
      where: { id: expense.id },
      data: { currentApprovalStep: currentStep },
    });
  }

  res.status(201).json({
    message: "Expense submitted successfully",
    expense: {
      id: expense.id,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      status: expense.status,
      employee: expense.employee,
      company: expense.company,
      createdAt: expense.createdAt,
    },
  });
});

/**
 * Get expense history for the current user
 * GET /api/expenses/my-expenses
 * Role: EMPLOYEE, MANAGER, ADMIN
 */
export const getMyExpenses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { status, startDate, endDate } = req.query;

  // Build filter
  const where: any = {
    employeeId: req.user.id,
    companyId: req.user.companyId,
  };

  // Filter by status if provided
  if (status && typeof status === "string") {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (validStatuses.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate as string);
    }
    if (endDate) {
      where.date.lte = new Date(endDate as string);
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
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
    orderBy: { createdAt: "desc" },
  });

  // Get user's company for currency conversion
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { company: true },
  });

  if (!user?.company) {
    throw new AppError("Company not found", 404);
  }

  // Convert amounts to company currency if different
  const expensesWithConversion = await Promise.all(
    expenses.map(async (expense: any) => {
      let convertedAmount = expense.amount;
      let conversionRate = 1;

      if (expense.currency !== user.company!.baseCurrency) {
        try {
          const conversion = await convertCurrency(
            expense.amount,
            expense.currency,
            user.company!.baseCurrency
          );
          convertedAmount = conversion.converted;
          conversionRate = conversion.rate;
        } catch (error) {
          console.error(`Failed to convert currency for expense ${expense.id}:`, error);
          // Keep original amount if conversion fails
        }
      }

      return {
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount,
        companyCurrency: user.company!.baseCurrency,
        conversionRate,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        status: expense.status,
        currentApprovalStep: expense.currentApprovalStep,
        approvalSteps: expense.approvalSteps,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      };
    })
  );

  res.json({
    count: expensesWithConversion.length,
    expenses: expensesWithConversion,
  });
});

/**
 * Get all expenses (Admin/Manager)
 * GET /api/expenses
 * Role: ADMIN, MANAGER
 */
export const getAllExpenses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const { status, employeeId } = req.query;

  // Build filter
  const where: any = {
    companyId: req.user.companyId,
  };

  // Managers can only see their team's expenses
  if (req.user.role === "MANAGER") {
    // Get all subordinates
    const subordinates = await prisma.user.findMany({
      where: {
        managerId: req.user.id,
        companyId: req.user.companyId,
      },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s: any) => s.id);
    // Include manager's own expenses too
    where.employeeId = { in: [...subordinateIds, req.user.id] };
  }

  // Filter by specific employee (Admin only)
  if (employeeId && typeof employeeId === "string" && req.user.role === "ADMIN") {
    where.employeeId = employeeId;
  }

  // Filter by status
  if (status && typeof status === "string") {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (validStatuses.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
  });

  // Get company for currency conversion
  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Convert amounts to company currency
  const expensesWithConversion = await Promise.all(
    expenses.map(async (expense: any) => {
      let convertedAmount = expense.amount;
      let conversionRate = 1;

      if (expense.currency !== company.baseCurrency) {
        try {
          const conversion = await convertCurrency(
            expense.amount,
            expense.currency,
            company.baseCurrency
          );
          convertedAmount = conversion.converted;
          conversionRate = conversion.rate;
        } catch (error) {
          console.error(`Failed to convert currency for expense ${expense.id}:`, error);
        }
      }

      return {
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount,
        companyCurrency: company.baseCurrency,
        conversionRate,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        status: expense.status,
        currentApprovalStep: expense.currentApprovalStep,
        employee: expense.employee,
        approvalSteps: expense.approvalSteps,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      };
    })
  );

  res.json({
    count: expensesWithConversion.length,
    expenses: expensesWithConversion,
  });
});

/**
 * Get single expense details
 * GET /api/expenses/:expenseId
 * Role: EMPLOYEE (own), MANAGER (team), ADMIN (all)
 */
export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
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
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
  });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  // Authorization check
  if (req.user.role === "EMPLOYEE") {
    // Employee can only see their own expenses
    if (expense.employeeId !== req.user.id) {
      throw new AppError("Forbidden: You can only view your own expenses", 403);
    }
  } else if (req.user.role === "MANAGER") {
    // Manager can see their team's expenses
    const isOwnExpense = expense.employeeId === req.user.id;
    const isSubordinate = await prisma.user.findFirst({
      where: {
        id: expense.employeeId,
        managerId: req.user.id,
      },
    });

    if (!isOwnExpense && !isSubordinate) {
      throw new AppError("Forbidden: You can only view your team's expenses", 403);
    }
  }

  // Convert amount to company currency if different
  let convertedAmount = expense.amount;
  let conversionRate = 1;

  if (expense.currency !== expense.company.baseCurrency) {
    try {
      const conversion = await convertCurrency(
        expense.amount,
        expense.currency,
        expense.company.baseCurrency
      );
      convertedAmount = conversion.converted;
      conversionRate = conversion.rate;
    } catch (error) {
      console.error(`Failed to convert currency for expense ${expense.id}:`, error);
    }
  }

  res.json({
    id: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    convertedAmount,
    companyCurrency: expense.company.baseCurrency,
    conversionRate,
    category: expense.category,
    description: expense.description,
    date: expense.date,
    status: expense.status,
    currentApprovalStep: expense.currentApprovalStep,
    employee: expense.employee,
    company: expense.company,
    approvalSteps: expense.approvalSteps,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  });
});

/**
 * Update expense (only if PENDING and own expense)
 * PUT /api/expenses/:expenseId
 * Role: EMPLOYEE (own, if pending)
 */
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { expenseId } = req.params;
  const { amount, currency, category, description, date } = req.body;

  // Get existing expense
  const existingExpense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      companyId: req.user.companyId,
    },
  });

  if (!existingExpense) {
    throw new AppError("Expense not found", 404);
  }

  // Check ownership
  if (existingExpense.employeeId !== req.user.id) {
    throw new AppError("Forbidden: You can only update your own expenses", 403);
  }

  // Check if expense is still pending
  if (existingExpense.status !== "PENDING") {
    throw new AppError("Cannot update expense that is already approved or rejected", 400);
  }

  // Update expense
  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(amount && { amount: parseFloat(amount) }),
      ...(currency && { currency: currency.toUpperCase() }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(date && { date: new Date(date) }),
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

  res.json({
    message: "Expense updated successfully",
    expense: {
      id: expense.id,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      status: expense.status,
      employee: expense.employee,
      approvalSteps: expense.approvalSteps,
      updatedAt: expense.updatedAt,
    },
  });
});

/**
 * Delete expense (Admin only or own if PENDING)
 * DELETE /api/expenses/:expenseId
 * Role: ADMIN, EMPLOYEE (own, if pending)
 */
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { expenseId } = req.params;

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      companyId: req.user.companyId,
    },
  });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  // Authorization check
  if (req.user.role !== "ADMIN") {
    // Non-admin can only delete their own pending expenses
    if (expense.employeeId !== req.user.id) {
      throw new AppError("Forbidden: You can only delete your own expenses", 403);
    }
    if (expense.status !== "PENDING") {
      throw new AppError("Cannot delete expense that is already approved or rejected", 400);
    }
  }

  // Delete expense (cascades to approval steps)
  await prisma.expense.delete({
    where: { id: expenseId },
  });

  res.json({ message: "Expense deleted successfully" });
});
