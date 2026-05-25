import { Server } from "socket.io";
import { WorkerStatus } from "@prisma/client";
import { AuthenticatedSocket } from "./socket.manager";
import TrackingService from "../modules/tracking/tracking.service";
import prisma from "../config/database";
import logger from "../utils/logger";

export const registerSocketHandlers = (socket: AuthenticatedSocket, io: Server) => {
  const user = socket.data.user!;

  // 1. Join a general communication room (e.g. customer profile room, worker profile room, booking room)
  socket.on("join_room", ({ roomId }: { roomId: string }) => {
    socket.join(roomId);
    logger.debug(`Socket ${socket.id} joined room ${roomId}`);
    socket.emit("room_joined", { roomId });
  });

  // 2. Register worker presence online
  socket.on("worker:register", async ({ workerId, cityId }: { workerId: string; cityId: string }) => {
    if (user.role !== "WORKER" || user.id !== workerId) {
      socket.emit("error", { message: "Unauthorized worker registration" });
      return;
    }

    try {
      // Join city room for job broadcasts and worker private room for direct messages
      socket.join(`city:${cityId}`);
      socket.join(`worker:${workerId}`);

      // Update worker status in PostgreSQL
      await prisma.workerProfile.update({
        where: { userId: workerId },
        data: {
          isOnline: true,
          status: WorkerStatus.IDLE,
        },
      });

      // Keep track of socket mapping in socket data
      socket.data.workerId = workerId;
      socket.data.cityId = cityId;

      logger.info(`Worker registered online: ID ${workerId} | City ${cityId}`);
      socket.emit("worker:registered", { status: "success", isOnline: true });
    } catch (error) {
      logger.error("Error registering worker online via socket:", error);
      socket.emit("error", { message: "Failed to register online" });
    }
  });

  // 3. Receive periodic location updates from worker
  socket.on(
    "worker:location_update",
    async (payload: {
      workerId: string;
      cityId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      bookingId?: string; // Optional: if worker is fulfilling a job
    }) => {
      const { workerId, cityId, latitude, longitude, heading, bookingId } = payload;

      if (user.role !== "WORKER" || user.id !== workerId) {
        socket.emit("error", { message: "Unauthorized location update" });
        return;
      }

      // Update Redis geospatial index
      await TrackingService.updateWorkerLocation(workerId, cityId, latitude, longitude, heading);

      // If fulfilling an active booking, stream location to the customer room
      if (bookingId) {
        io.to(`booking:${bookingId}`).emit("worker:location_stream", {
          bookingId,
          latitude,
          longitude,
          heading: heading || 0,
          timestamp: Date.now(),
        });
      }
    }
  );

  // 4. Handle client disconnect
  socket.on("disconnect", async () => {
    logger.info(`Socket Disconnected: ID ${socket.id} | User ${user.id}`);

    // If it was an online worker, remove from active track and update DB
    const { workerId, cityId } = socket.data as any;
    if (workerId) {
      try {
        await TrackingService.removeWorker(workerId);

        // Update database (optional: could add a delay/reconnection grace period, 
        // but for now we set to offline immediately to be safe)
        await prisma.workerProfile.update({
          where: { userId: workerId },
          data: {
            isOnline: false,
            status: WorkerStatus.OFFLINE,
          },
        });

        logger.info(`Worker went offline due to disconnect: ID ${workerId}`);
      } catch (error) {
        logger.error("Error setting worker status to offline on disconnect:", error);
      }
    }
  });
};
