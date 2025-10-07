import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";

/**
 * Get all approval rules for c    // Create approvers if provided
    if (approvers && Array.isArray(approvers) && approvers.length > 0) {
      console.log(`[DEBUG] Creating ${approvers.length} approvers for rule ${rule.id}`);
      for (let i = 0; i < approvers.length; i++) {
        const approverData = approvers[i];
        console.log(`[DEBUG] Creating approver ${i + 1}:`, approverData);
        const createdApprover = await tx.ruleApprover.create({
          data: {
            approvalRuleId: rule.id,
            approverId: approverData.approverId,
            sequence: approverData.sequence !== undefined ? approverData.sequence : i + 1,
            isRequired: approverData.isRequired || false,
          },
        });
        console.log(`[DEBUG] Created RuleApprover:`, createdApprover);
      }
    } else {
      console.log('[DEBUG] No approvers to create:', {
        approvers,
        isArray: Array.isArray(approvers),
        length: approvers?.length,
      });
    }/api/approval-rules
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
      ruleApprovers: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { sequence: "asc" },
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

  const companyId = req.user.companyId;

  const {
    name,
    ruleType,
    thresholdAmount,
    approvalPercentage,
    specificApproverId,
    isManagerApprover,
    approversSequenceEnabled,
    sequence,
    approvers, // Array of { approverId, sequence, isRequired }
  } = req.body;

    console.log('[DEBUG] Creating approval rule with data:', {
    name,
    ruleType,
    isManagerApprover,
    approversSequenceEnabled,
    approversCount: approvers?.length || 0,
    approvers: approvers,
  });

  console.log('=== APPROVERS ARRAY DETAILS ===');
  console.log('Approvers is array:', Array.isArray(approvers));
  console.log('Approvers content:', JSON.stringify(approvers, null, 2));


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
  if ((ruleType === "SPECIFIC" || ruleType === "HYBRID") && !specificApproverId && (!approvers || approvers.length === 0)) {
    throw new AppError("Specific approver or approvers list is required for SPECIFIC or HYBRID rules", 400);
  }

  // Validate specific approver exists and belongs to company
  if (specificApproverId) {
    const approver = await prisma.user.findFirst({
      where: {
        id: specificApproverId,
        companyId: companyId,
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

  // Validate approvers list if provided
  if (approvers && Array.isArray(approvers) && approvers.length > 0) {
    for (const approverData of approvers) {
      if (!approverData.approverId) {
        throw new AppError("Each approver must have an approverId", 400);
      }

      const approver = await prisma.user.findFirst({
        where: {
          id: approverData.approverId,
          companyId: companyId,
        },
      });

      if (!approver) {
        throw new AppError(`Approver ${approverData.approverId} not found or not in the same company`, 404);
      }

      if (approver.role !== "MANAGER" && approver.role !== "ADMIN") {
        throw new AppError(`Approver ${approver.name} must have MANAGER or ADMIN role`, 400);
      }
    }
  }

  // Get next sequence number if not provided
  let ruleSequence = sequence;
  if (!ruleSequence) {
    const lastRule = await prisma.approvalRule.findFirst({
      where: { companyId: companyId },
      orderBy: { sequence: "desc" },
    });
    ruleSequence = lastRule ? lastRule.sequence + 1 : 1;
  }

  // Create the rule with approvers in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the approval rule
    const rule = await tx.approvalRule.create({
      data: {
        name,
        ruleType,
        thresholdAmount: thresholdAmount || null,
        approvalPercentage: approvalPercentage || null,
        specificApproverId: specificApproverId || null,
        isManagerApprover: isManagerApprover !== undefined ? isManagerApprover : true,
        approversSequenceEnabled: approversSequenceEnabled !== undefined ? approversSequenceEnabled : true,
        sequence: ruleSequence,
        isActive: true, // Explicitly set to active when creating
        companyId: companyId,
      },
    });

    // Create rule approvers if provided
    if (approvers && Array.isArray(approvers) && approvers.length > 0) {
      for (let i = 0; i < approvers.length; i++) {
        const approverData = approvers[i];
        await tx.ruleApprover.create({
          data: {
            approvalRuleId: rule.id,
            approverId: approverData.approverId,
            sequence: approverData.sequence !== undefined ? approverData.sequence : i + 1,
            isRequired: approverData.isRequired || false,
          },
        });
      }
    }

    // Fetch the complete rule with approvers
    return await tx.approvalRule.findUnique({
      where: { id: rule.id },
      include: {
        specificApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ruleApprovers: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
    });
  });

  res.status(201).json({
    message: "Approval rule created successfully",
    rule: result,
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
    approversSequenceEnabled,
    sequence,
    approvers, // Array of { approverId, sequence, isRequired }
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

  // Validate approvers list if provided
  if (approvers && Array.isArray(approvers)) {
    for (const approverData of approvers) {
      if (!approverData.approverId) {
        throw new AppError("Each approver must have an approverId", 400);
      }

      const approver = await prisma.user.findFirst({
        where: {
          id: approverData.approverId,
          companyId: req.user.companyId,
        },
      });

      if (!approver) {
        throw new AppError(`Approver ${approverData.approverId} not found or not in the same company`, 404);
      }

      if (approver.role !== "MANAGER" && approver.role !== "ADMIN") {
        throw new AppError(`Approver ${approver.name} must have MANAGER or ADMIN role`, 400);
      }
    }
  }

  // Update the rule with approvers in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the approval rule
    const rule = await tx.approvalRule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(ruleType && { ruleType }),
        ...(thresholdAmount !== undefined && { thresholdAmount }),
        ...(approvalPercentage !== undefined && { approvalPercentage }),
        ...(specificApproverId !== undefined && { specificApproverId }),
        ...(isManagerApprover !== undefined && { isManagerApprover }),
        ...(approversSequenceEnabled !== undefined && { approversSequenceEnabled }),
        ...(sequence !== undefined && { sequence }),
      },
    });

    // Update rule approvers if provided
    if (approvers !== undefined) {
      // Delete existing approvers
      await tx.ruleApprover.deleteMany({
        where: { approvalRuleId: ruleId },
      });

      // Create new approvers
      if (Array.isArray(approvers) && approvers.length > 0) {
        for (let i = 0; i < approvers.length; i++) {
          const approverData = approvers[i];
          await tx.ruleApprover.create({
            data: {
              approvalRuleId: rule.id,
              approverId: approverData.approverId,
              sequence: approverData.sequence !== undefined ? approverData.sequence : i + 1,
              isRequired: approverData.isRequired || false,
            },
          });
        }
      }
    }

    // Fetch the complete rule with approvers
    return await tx.approvalRule.findUnique({
      where: { id: rule.id },
      include: {
        specificApprover: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ruleApprovers: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
    });
  });

  res.json({
    message: "Approval rule updated successfully",
    rule: result,
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
 * Toggle approval rule status (active/inactive)
 * PATCH /api/approval-rules/:ruleId/toggle
 * Role: ADMIN
 */
export const toggleRuleStatus = asyncHandler(async (req: Request, res: Response) => {
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

  // Toggle the isActive field
  const updatedRule = await prisma.approvalRule.update({
    where: { id: ruleId },
    data: {
      isActive: !existingRule.isActive,
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
    message: `Approval rule ${updatedRule.isActive ? 'activated' : 'deactivated'} successfully`,
    rule: updatedRule,
  });
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
