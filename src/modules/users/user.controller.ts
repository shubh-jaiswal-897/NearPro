import { Request, Response, NextFunction } from "express";
import UserService from "./user.service";

export class UserController {
  /**
   * GET /api/users/admin/all
   */
  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.listAllUsers();
      res.status(200).json({ status: "success", data: { users } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/admin/:id/toggle-active
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.toggleUserActive(id as string);
      res.status(200).json({
        status: "success",
        message: `User status changed to ${user.isActive ? "Active" : "Inactive"}`,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/admin/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id as string);
      res.status(200).json({ status: "success", ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
