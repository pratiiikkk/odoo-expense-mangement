import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { auth } from "../lib/auth";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { getCurrencyForCountry } from "../services/countryService";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, country = "United States" } = req.body;

  // Validate input
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  try {
    // Use Better Auth to create the user and account
    const signupResult = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!signupResult || !signupResult.user) {
      throw new AppError("Failed to create user", 500);
    }

    const userId = signupResult.user.id;

    // Get currency for the selected country
    const baseCurrency = await getCurrencyForCountry(country);

    // Create company and update user in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: `${name}'s Company`,
          country,
          baseCurrency,
          adminUserId: userId,
        },
      });

      // Update user with company and ADMIN role
      await tx.user.update({
        where: { id: userId },
        data: {
          companyId: company.id,
          role: "ADMIN",
        },
      });

      console.log(`✅ Company created for user ${email}: ${company.id}`);
    });

    // Return the signup result
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: signupResult.user.id,
        name: signupResult.user.name,
        email: signupResult.user.email,
      },
    });
  } catch (error: any) {
    // If something fails, try to clean up the user
    try {
      await prisma.user.delete({
        where: { email },
      });
    } catch (cleanupError) {
      console.error("Failed to cleanup user after error:", cleanupError);
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error("Signup error:", error);
    throw new AppError("Failed to create user and company", 500);
  }
});
