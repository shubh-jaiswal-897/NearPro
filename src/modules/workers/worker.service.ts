import prisma from "../../config/database";
import TrackingService from "../tracking/tracking.service";
import { WorkerStatus } from "@prisma/client";

export class WorkerService {
  /**
   * Toggle worker online presence
   */
  static async toggleOnlineStatus(userId: string, isOnline: boolean) {
    const worker = await prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      const error: any = new Error("Worker profile not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.workerProfile.update({
      where: { userId },
      data: {
        isOnline,
        status: isOnline ? WorkerStatus.IDLE : WorkerStatus.OFFLINE,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Clean up Redis active index if worker goes offline
    if (!isOnline) {
      await TrackingService.removeWorker(userId);
    }

    return updated;
  }

  /**
   * Fetch worker profile stats and earnings ledger history
   */
  static async getWorkerStats(userId: string) {
    const worker = await prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        earningsLogs: {
          orderBy: { createdAt: "desc" },
          take: 10, // Get last 10 logs
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
      },
    });

    if (!worker) {
      const error: any = new Error("Worker profile not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      name: `${worker.user.firstName} ${worker.user.lastName}`,
      rating: worker.user.rating,
      status: worker.status,
      isOnline: worker.isOnline,
      totalEarnings: Number(worker.totalEarnings),
      earningsHistory: worker.earningsLogs.map((log) => ({
        id: log.id,
        bookingId: log.bookingId,
        amount: Number(log.amount),
        netPayout: Number(log.netPayout),
        isSettled: log.isSettled,
        createdAt: log.createdAt,
      })),
    };
  }
}

export default WorkerService;
