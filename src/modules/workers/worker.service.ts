import prisma from "../../config/database";
import TrackingService from "../tracking/tracking.service";
import { WorkerStatus } from "@prisma/client";
import supabase from "../../config/supabase";

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
          select: { firstName: true, lastName: true },
        },
      },
    });

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
        earningsLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        user: { select: { firstName: true, lastName: true, rating: true } },
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

  /**
   * ADMIN: Get all pending (unverified) worker registrations
   */
  static async listPendingWorkers() {
    return prisma.workerProfile.findMany({
      where: { isVerified: false },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, createdAt: true },
        },
        city: { select: { name: true } },
        serviceCategory: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * ADMIN: Get all workers (verified + unverified)
   */
  static async listAllWorkers() {
    return prisma.workerProfile.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, isActive: true, createdAt: true },
        },
        city: { select: { name: true } },
        serviceCategory: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * ADMIN: Approve a worker — set isVerified = true
   */
  static async approveWorker(workerId: string) {
    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) {
      const error: any = new Error("Worker not found");
      error.statusCode = 404;
      throw error;
    }

    // Reactivate user if they were suspended
    await prisma.user.update({
      where: { id: worker.userId },
      data: { isActive: true }
    });

    return prisma.workerProfile.update({
      where: { id: workerId },
      data: { isVerified: true },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
      },
    });
  }

  /**
   * ADMIN: Suspend a worker — set user.isActive = false, status = OFFLINE
   */
  static async suspendWorker(workerId: string) {
    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) {
      const error: any = new Error("Worker not found");
      error.statusCode = 404;
      throw error;
    }

    // Set user to inactive
    await prisma.user.update({
      where: { id: worker.userId },
      data: { isActive: false }
    });

    // Update worker status and go offline
    const updatedWorker = await prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        isOnline: false,
        status: WorkerStatus.OFFLINE,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, isActive: true } }
      }
    });

    // Remove from Redis active workers geo set
    try {
      await TrackingService.removeWorker(worker.userId);
    } catch (err) {
      console.error("Failed to remove suspended worker from Redis active list:", err);
    }

    return updatedWorker;
  }

  /**
   * ADMIN: Reject & delete worker registration
   */
  static async rejectWorker(workerId: string) {
    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!worker) {
      const error: any = new Error("Worker not found");
      error.statusCode = 404;
      throw error;
    }

    // Delete from local DB (cascade removes WorkerProfile)
    await prisma.user.delete({ where: { id: worker.userId } });

    // Also remove from Supabase Auth
    try {
      const isMockAuth = process.env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!isMockAuth) {
        await supabase.auth.admin.deleteUser(worker.userId);
      }
    } catch (err) {
      console.error(`Failed to delete worker ${worker.userId} from Supabase Auth:`, err);
    }

    return { message: "Worker registration rejected and account removed" };
  }
}

export default WorkerService;
