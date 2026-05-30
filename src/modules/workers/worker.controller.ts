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
        res.status(400).json({ status: "error", message: "isOnline field must be a boolean" });
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
      res.status(200).json({ status: "success", data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: GET /api/workers/pending
   */
  static async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workers = await WorkerService.listPendingWorkers();
      res.status(200).json({ status: "success", data: { workers } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: GET /api/workers/all
   */
  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workers = await WorkerService.listAllWorkers();
      res.status(200).json({ status: "success", data: { workers } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: PATCH /api/workers/:id/approve
   */
  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const worker = await WorkerService.approveWorker(id);
      res.status(200).json({
        status: "success",
        message: "Worker approved successfully",
        data: { worker },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: DELETE /api/workers/:id/reject
   */
  static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await WorkerService.rejectWorker(id);
      res.status(200).json({ status: "success", ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default WorkerController;
