import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import logger from "../utils/logger";
import supabase from "../config/supabase";

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

    // Validate the Supabase JWT — this also handles expiry automatically
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
