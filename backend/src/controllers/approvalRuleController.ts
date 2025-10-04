import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";

/**
 * Get all approval rules for company
 * GET /api/approval-rules
 * Role: ADMIN
 */
export const getApprovalRules = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const rules = await prisma.approvalRule.findMany({
    where: {
      companyId: req.user.companyId,
    },
    include: {
      specificApprover: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { sequence: "asc" },
  });

  res.json({
    count: rules.length,
    rules,
  });
});

/**
 * Create approval rule
 * POST /api/approval-rules
 * Role: ADMIN
 */
export const createApprovalRule = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const {
    name,
    ruleType,
    thresholdAmount,
    approvalPercentage,
    specificApproverId,
    isManagerApprover,
    sequence,
  } = req.body;

  // Validate required fields
  if (!name || !ruleType) {
    throw new AppError("Name and ruleType are required", 400);
  }

  // Validate rule type
  if (!["SEQUENTIAL", "PERCENTAGE", "SPECIFIC", "HYBRID"].includes(ruleType)) {
    throw new AppError(
      "Invalid rule type. Must be SEQUENTIAL, PERCENTAGE, SPECIFIC, or HYBRID",
      400
    );
  }

  // Validate percentage rule
  if ((ruleType === "PERCENTAGE" || ruleType === "HYBRID") && !approvalPercentage) {
    throw new AppError("Approval percentage is required for PERCENTAGE or HYBRID rules", 400);
  }

  if (approvalPercentage && (approvalPercentage < 0 || approvalPercentage > 100)) {
    throw new AppError("Approval percentage must be between 0 and 100", 400);
  }

  // Validate specific approver rule
  if ((ruleType === "SPECIFIC" || ruleType === "HYBRID") && !specificApproverId) {
    throw new AppError("Specific approver is required for SPECIFIC or HYBRID rules", 400);
  }

  // Validate specific approver exists and belongs to company
  if (specificApproverId) {
    const approver = await prisma.user.findFirst({
      where: {
        id: specificApproverId,
        companyId: req.user.companyId,
      },
    });

    if (!approver) {
      throw new AppError("Specific approver not found or not in the same company", 404);
    }

    // Approver should be MANAGER or ADMIN
    if (approver.role !== "MANAGER" && approver.role !== "ADMIN") {
      throw new AppError("Specific approver must have MANAGER or ADMIN role", 400);
    }
  }

  // Get next sequence number if not provided
  let ruleSequence = sequence;
  if (!ruleSequence) {
    const lastRule = await prisma.approvalRule.findFirst({
      where: { companyId: req.user.companyId },
      orderBy: { sequence: "desc" },
    });
    ruleSequence = lastRule ? lastRule.sequence + 1 : 1;
  }

  // Create the rule
  const rule = await prisma.approvalRule.create({
    data: {
      name,
      ruleType,
      thresholdAmount: thresholdAmount || null,
      approvalPercentage: approvalPercentage || null,
      specificApproverId: specificApproverId || null,
      isManagerApprover: isManagerApprover !== undefined ? isManagerApprover : true,
      sequence: ruleSequence,
      companyId: req.user.companyId,
    },
    include: {
      specificApprover: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  res.status(201).json({
    message: "Approval rule created successfully",
    rule,
  });
});

/**
 * Update approval rule
 * PUT /api/approval-rules/:ruleId
 * Role: ADMIN
 */
export const updateApprovalRule = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const { ruleId } = req.params;
  const {
    name,
    ruleType,
    thresholdAmount,
    approvalPercentage,
    specificApproverId,
    isManagerApprover,
    sequence,
  } = req.body;

  // Get existing rule
  const existingRule = await prisma.approvalRule.findFirst({
    where: {
      id: ruleId,
      companyId: req.user.companyId,
    },
  });

  if (!existingRule) {
    throw new AppError("Approval rule not found", 404);
  }

  // Validate rule type if provided
  if (ruleType && !["SEQUENTIAL", "PERCENTAGE", "SPECIFIC", "HYBRID"].includes(ruleType)) {
    throw new AppError(
      "Invalid rule type. Must be SEQUENTIAL, PERCENTAGE, SPECIFIC, or HYBRID",
      400
    );
  }

  // Validate specific approver if provided
  if (specificApproverId) {
    const approver = await prisma.user.findFirst({
      where: {
        id: specificApproverId,
        companyId: req.user.companyId,
      },
    });

    if (!approver) {
      throw new AppError("Specific approver not found or not in the same company", 404);
    }

    if (approver.role !== "MANAGER" && approver.role !== "ADMIN") {
      throw new AppError("Specific approver must have MANAGER or ADMIN role", 400);
    }
  }

  // Update the rule
  const rule = await prisma.approvalRule.update({
    where: { id: ruleId },
    data: {
      ...(name && { name }),
      ...(ruleType && { ruleType }),
      ...(thresholdAmount !== undefined && { thresholdAmount }),
      ...(approvalPercentage !== undefined && { approvalPercentage }),
      ...(specificApproverId !== undefined && { specificApproverId }),
      ...(isManagerApprover !== undefined && { isManagerApprover }),
      ...(sequence !== undefined && { sequence }),
    },
    include: {
      specificApprover: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  res.json({
    message: "Approval rule updated successfully",
    rule,
  });
});

/**
 * Delete approval rule
 * DELETE /api/approval-rules/:ruleId
 * Role: ADMIN
 */
export const deleteApprovalRule = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const { ruleId } = req.params;

  const existingRule = await prisma.approvalRule.findFirst({
    where: {
      id: ruleId,
      companyId: req.user.companyId,
    },
  });

  if (!existingRule) {
    throw new AppError("Approval rule not found", 404);
  }

  await prisma.approvalRule.delete({
    where: { id: ruleId },
  });

  res.json({ message: "Approval rule deleted successfully" });
});

/**
 * Get eligible approvers for a rule
 * GET /api/approval-rules/eligible-approvers
 * Role: ADMIN
 */
export const getEligibleApprovers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  // Get all managers and admins in the company
  const approvers = await prisma.user.findMany({
    where: {
      companyId: req.user.companyId,
      role: {
        in: ["MANAGER", "ADMIN"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({
    count: approvers.length,
    approvers,
  });
});
