import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { getCurrencyForCountry } from "../services/countryService";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
      companyId: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create company ONLY for the first signup (not for admin-created users)
          try {
            // Wait to allow admin's user creation to set companyId and role first
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if user already has a company or role (set by admin during creation)
            const existingUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { 
                companyId: true, 
                role: true,
              },
            });

            // Only create company if user doesn't have companyId AND role is default EMPLOYEE
            // If role is anything other than EMPLOYEE or if companyId exists, admin created this user
            if (!existingUser?.companyId && existingUser?.role === "EMPLOYEE") {
              const defaultCountry = "United States";
              const baseCurrency = await getCurrencyForCountry(defaultCountry);
              
              // Create company with user as admin
              const company = await prisma.company.create({
                data: {
                  name: `${user.name}'s Company`,
                  country: defaultCountry,
                  baseCurrency,
                  adminUserId: user.id,
                },
              });

              // Update user with company and ADMIN role (only for self-signup)
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  companyId: company.id,
                  role: "ADMIN",
                },
              });

              console.log(`✅ Company created for user ${user.email}: ${company.id}`);
            } else {
              console.log(`ℹ️ User ${user.email} already configured by admin, skipping auto-setup`);
            }
          } catch (error) {
            console.error("Failed to auto-create company for user:", error);
            // Don't throw error to prevent user creation failure
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
