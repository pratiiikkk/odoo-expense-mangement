import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { auth } from "../lib/auth";
import crypto from "crypto";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      company: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      manager: user.manager,
      createdAt: user.createdAt,
    },
  });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  const users = await prisma.user.findMany({
    where: { companyId: req.user.companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, managerId } = req.body;

  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  // Validate required fields
  if (!name || !email || !role) {
    throw new AppError("Name, email, and role are required", 400);
  }

  // Validate role
  if (!["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) {
    throw new AppError("Invalid role. Must be EMPLOYEE, MANAGER, or ADMIN", 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Validate manager if provided
  if (managerId) {
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        companyId: req.user.companyId,
      },
    });

    if (!manager) {
      throw new AppError("Manager not found or not in the same company", 404);
    }

    // Manager should have MANAGER or ADMIN role
    if (manager.role !== "MANAGER" && manager.role !== "ADMIN") {
      throw new AppError("Selected manager must have MANAGER or ADMIN role", 400);
    }
  }

  // Generate random password
  const randomPassword = crypto.randomBytes(8).toString("hex");

  // Use Better Auth to create the user with proper password hashing
  const signupResult = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password: randomPassword,
    },
  });

  if (!signupResult || !signupResult.user) {
    throw new AppError("Failed to create user account", 500);
  }

  // IMPORTANT: Update user immediately to prevent the Better Auth hook from creating a company
  // The hook checks if companyId exists, so we set it here first
  const user = await prisma.user.update({
    where: { id: signupResult.user.id },
    data: {
      role,
      companyId: req.user.companyId,
      managerId,
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Delete any auto-created company (if the hook ran before our update)
  const autoCreatedCompany = await prisma.company.findFirst({
    where: { adminUserId: signupResult.user.id },
  });
  
  if (autoCreatedCompany && autoCreatedCompany.id !== req.user.companyId) {
    console.log(`Cleaning up auto-created company for ${email}`);
    await prisma.company.delete({ where: { id: autoCreatedCompany.id } });
  }

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      manager: user.manager,
      createdAt: user.createdAt,
    },
    temporaryPassword: randomPassword,
    message: "User created successfully. Send this password to the user securely.",
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, role, managerId } = req.body;

  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  // Ensure user belongs to same company
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: req.user.companyId,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Validate role if provided
  if (role && !["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) {
    throw new AppError("Invalid role. Must be EMPLOYEE, MANAGER, or ADMIN", 400);
  }

  // Validate manager if provided
  if (managerId) {
    // Check if trying to set themselves as their own manager
    if (managerId === userId) {
      throw new AppError("User cannot be their own manager", 400);
    }

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        companyId: req.user.companyId,
      },
    });

    if (!manager) {
      throw new AppError("Manager not found or not in the same company", 404);
    }

    // Manager should have MANAGER or ADMIN role
    if (manager.role !== "MANAGER" && manager.role !== "ADMIN") {
      throw new AppError("Selected manager must have MANAGER or ADMIN role", 400);
    }

    // Check for circular manager relationships
    await checkCircularManagerRelationship(managerId, userId);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      role,
      managerId,
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    manager: user.manager,
    updatedAt: user.updatedAt,
  });
});

/**
 * Helper function to check for circular manager relationships
 * Prevents A -> B -> A or A -> B -> C -> A scenarios
 */
async function checkCircularManagerRelationship(
  managerId: string,
  employeeId: string,
  visited: Set<string> = new Set()
): Promise<void> {
  if (visited.has(managerId)) {
    throw new AppError("Circular manager relationship detected", 400);
  }

  visited.add(managerId);

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { managerId: true },
  });

  if (manager?.managerId) {
    if (manager.managerId === employeeId) {
      throw new AppError("Circular manager relationship detected", 400);
    }
    await checkCircularManagerRelationship(manager.managerId, employeeId, visited);
  }
}

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  console.log('=== DELETE USER REQUEST ===');
  console.log('UserId to delete:', userId);
  console.log('Requester:', req.user?.id, req.user?.role);

  if (!req.user?.companyId) {
    throw new AppError("User not associated with a company", 400);
  }

  // Ensure user belongs to same company
  const existingUser = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: req.user.companyId,
    },
    include: {
      expenses: true,
      approvalSteps: true,
      employees: true,
      managedApprovalRules: true,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new AppError("User not found", 404);
  }

  console.log('User found:', existingUser.name, existingUser.email);

  // Check if user is a company admin
  const isCompanyAdmin = await prisma.company.findFirst({
    where: { adminUserId: userId },
  });

  console.log('Delete user check:', {
    userId,
    userName: existingUser.name,
    isCompanyAdmin: !!isCompanyAdmin,
    companyAdminId: isCompanyAdmin?.adminUserId,
    expensesCount: existingUser.expenses.length,
    approvalStepsCount: existingUser.approvalSteps.length,
    employeesCount: existingUser.employees.length,
    managedRulesCount: existingUser.managedApprovalRules.length,
  });

  if (isCompanyAdmin) {
    console.log('BLOCKED: User is company admin');
    throw new AppError("Cannot delete the company admin. Please transfer admin rights to another user first.", 400);
  }

  // Check if user has dependencies that prevent deletion
  if (existingUser.expenses.length > 0) {
    console.log('BLOCKED: User has expenses');
    throw new AppError(`Cannot delete user with ${existingUser.expenses.length} existing expense(s). Please delete expenses first.`, 400);
  }

  if (existingUser.approvalSteps.length > 0) {
    console.log('BLOCKED: User has approval steps');
    throw new AppError(`Cannot delete user who is an approver in ${existingUser.approvalSteps.length} pending approval(s). Please complete or reassign approvals first.`, 400);
  }

  if (existingUser.employees.length > 0) {
    console.log('BLOCKED: User manages employees');
    throw new AppError(`Cannot delete user who is managing ${existingUser.employees.length} employee(s). Please reassign their manager first.`, 400);
  }

  if (existingUser.managedApprovalRules.length > 0) {
    console.log('BLOCKED: User in approval rules');
    throw new AppError(`Cannot delete user who is configured in ${existingUser.managedApprovalRules.length} approval rule(s). Please update rules first.`, 400);
  }

  console.log('All checks passed, proceeding with deletion');

  // Delete user's sessions and accounts first
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  console.log('User deleted successfully');
  res.json({ message: "User deleted successfully" });
});
