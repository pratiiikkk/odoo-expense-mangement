import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";

/**
 * Get dashboard statistics for current user
 * GET /api/dashboard/stats
 * Role: ALL
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const stats: any = {
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    pendingApprovals: 0,
    teamMembers: 0,
  };

  // Get user's own expense statistics
  const myExpenses = await prisma.expense.groupBy({
    by: ['status'],
    where: {
      employeeId: req.user.id,
      companyId: req.user.companyId,
    },
    _count: {
      id: true,
    },
  });

  myExpenses.forEach((group) => {
    stats.totalExpenses += group._count.id;
    if (group.status === 'PENDING') stats.pendingExpenses = group._count.id;
    if (group.status === 'APPROVED') stats.approvedExpenses = group._count.id;
    if (group.status === 'REJECTED') stats.rejectedExpenses = group._count.id;
  });

  // For Manager/Admin: Get pending approvals count
  if (req.user.role === 'MANAGER' || req.user.role === 'ADMIN') {
    const pendingApprovals = await prisma.approvalStep.count({
      where: {
        approverId: req.user.id,
        status: 'PENDING',
        expense: {
          companyId: req.user.companyId,
          status: 'PENDING',
        },
      },
    });
    stats.pendingApprovals = pendingApprovals;
  }

  // For Admin: Get team member count
  if (req.user.role === 'ADMIN') {
    const teamCount = await prisma.user.count({
      where: {
        companyId: req.user.companyId,
      },
    });
    stats.teamMembers = teamCount;
  }

  res.json(stats);
});
