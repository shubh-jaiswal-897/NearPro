import { Request, Response, NextFunction } from "express";
import AuthService from "./auth.service";
import prisma from "../../config/database";

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          customerProfile: true,
          workerProfile: {
            include: {
              city: true,
              serviceCategory: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          status: "error",
          message: "User not found",
        });
        return;
      }

      const { passwordHash: _, ...userWithoutPassword } = user;

      res.status(200).json({
        status: "success",
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
