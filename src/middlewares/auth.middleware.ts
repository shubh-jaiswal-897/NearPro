import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import supabase from "../config/supabase";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        message: "Authorization token missing or invalid",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        status: "error",
        message: "Authorization token missing or invalid",
      });
      return;
    }

    // 1. Try to verify as a local JWT first (for local mock/dev or custom auth)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role: Role;
      };
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch (localJwtError) {
      // If it's not a valid local JWT, fall back to Supabase
    }

    // 2. Validate the Supabase JWT — this also handles expiry automatically
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      logger.warn("Supabase token validation failed:", error?.message);
      res.status(401).json({
        status: "error",
        message: "Authorization token is expired or invalid",
      });
      return;
    }

    const supabaseUser = data.user;
    const metadata = supabaseUser.user_metadata ?? {};

    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      role: (metadata.role as Role) ?? Role.CUSTOMER,
    };

    next();
  } catch (error) {
    logger.warn("Authentication error:", error);
    res.status(401).json({
      status: "error",
      message: "Authorization token is expired or invalid",
    });
  }
};

export const requireRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: "error",
        message: "Forbidden: You do not have permissions to perform this action",
      });
      return;
    }

    next();
  };
};
