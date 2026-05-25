import { Request, Response, NextFunction } from "express";
import WorkerService from "./worker.service";

export class WorkerController {
  /**
   * PATCH /api/workers/toggle-online
   */
  static async toggleOnline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { isOnline } = req.body;

      if (typeof isOnline !== "boolean") {
        res.status(400).json({
          status: "error",
          message: "isOnline field must be a boolean",
        });
        return;
      }

      const worker = await WorkerService.toggleOnlineStatus(userId, isOnline);
      res.status(200).json({
        status: "success",
        message: `Worker presence updated to ${isOnline ? "ONLINE" : "OFFLINE"}`,
        data: { worker },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/workers/stats
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await WorkerService.getWorkerStats(userId);
      res.status(200).json({
        status: "success",
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WorkerController;
