import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

// Extend Express Request type to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        companyId?: string;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Attach user and session to request
    // Better Auth now includes role and companyId in session.user
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role || "EMPLOYEE",
      companyId: (session.user as any).companyId,
    };

    req.session = {
      id: session.session.id,
      userId: session.session.userId,
      expiresAt: new Date(session.session.expiresAt),
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role || "EMPLOYEE",
        companyId: (session.user as any).companyId,
      };

      req.session = {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: new Date(session.session.expiresAt),
      };
    }

    next();
  } catch (error) {
    // Don't block the request if auth fails
    next();
  }
};
