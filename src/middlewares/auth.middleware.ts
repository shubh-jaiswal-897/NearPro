import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import logger from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

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

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.warn("JWT Verification failed:", error);
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
