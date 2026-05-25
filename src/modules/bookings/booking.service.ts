import prisma from "../../config/database";
import redis from "../../config/redis";
import mapsClient from "../../config/maps";
import TrackingService from "../tracking/tracking.service";
import { socketManager } from "../../socket/socket.manager";
import { BookingStatus, WorkerStatus, Role } from "@prisma/client";
import logger from "../../utils/logger";
import { sendPushNotification } from "../../config/firebase";

export class BookingService {
  /**
   * Create a new booking request and trigger the allocation workflow
   */
  static async createBooking(data: {
    customerId: string;
    serviceId: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
  }) {
    const { customerId, serviceId, pickupLat, pickupLng, pickupAddress } = data;

    // 1. Resolve city using geofencing
    const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT "id", "name" FROM "City"
      WHERE ST_Covers("boundary", ST_SetSRID(ST_Point($1, $2), 4326)::geography)
        AND "isActive" = true
      LIMIT 1
    `, pickupLng, pickupLat);

    const city = results[0];
    if (!city) {
      const error: any = new Error("Our service is not active in your current location yet");
      error.statusCode = 400;
      throw error;
    }

    const cityId = city.id;

    // 2. Fetch service details and local pricing
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      include: {
        category: true,
        pricings: {
          where: { cityId },
        },
      },
    });

    if (!service || service.pricings.length === 0) {
      const error: any = new Error("Selected service is not available or priced in your city");
      error.statusCode = 400;
      throw error;
    }

    const pricing = service.pricings[0]!;

    // 3. Estimate price (Hyperlocal starting pricing: basePrice + platformFee)
    const basePrice = Number(pricing.basePrice);
    const platformCut = Number(pricing.platformFee);
    const workerCut = basePrice - platformCut;
    const totalPrice = basePrice;

    // Fetch the customer profile ID
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      const error: any = new Error("Customer profile not found");
      error.statusCode = 404;
      throw error;
    }

    // 4. Create PENDING booking in database
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        serviceId,
        cityId,
        status: BookingStatus.PENDING,
        pickupLat,
        pickupLng,
        pickupAddress,
        totalPrice,
        platformCut,
        workerCut,
      },
      include: {
        service: true,
        city: true,
      },
    });

    // 5. Asynchronously trigger the dispatch loop
    // In production, you would offload this to a job queue (like BullMQ)
    this.dispatchBooking(booking.id, service.categoryId).catch((err) => {
      logger.error(`Error in dispatching booking ${booking.id}:`, err);
    });

    return booking;
  }

  /**
   * Hyperlocal Worker Allocation Algorithm
   * Find nearby eligible workers and broadcast the job
   */
  static async dispatchBooking(bookingId: string, categoryId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.status !== BookingStatus.PENDING) return;

    logger.info(`Starting dispatch allocation loop for booking: ${bookingId}`);

    // 1. Search Redis for nearby workers within 5 km radius
    const nearbyWorkers = await TrackingService.findNearbyWorkers(
      booking.cityId,
      booking.pickupLat,
      booking.pickupLng,
      5.0
    );

    if (nearbyWorkers.length === 0) {
      logger.warn(`No active workers found in Redis Geo index for booking ${bookingId}`);
      // Notify customer socket that search returned empty
      const io = socketManager.getIO();
      io.to(`booking:${bookingId}`).emit("job:allocation_failed", {
        bookingId,
        message: "No technicians available in your area. Retrying...",
      });
      return;
    }

    const workerIds = nearbyWorkers.map((w) => w.workerId);

    // 2. Filter workers in Postgres (must be idle, online, verified, and correct service category)
    const eligibleWorkers = await prisma.workerProfile.findMany({
      where: {
        userId: { in: workerIds },
        serviceCategoryId: categoryId,
        status: WorkerStatus.IDLE,
        isOnline: true,
        isVerified: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
      },
    });

    if (eligibleWorkers.length === 0) {
      logger.warn(`No eligible online & idle workers found in DB for booking ${bookingId}`);
      return;
    }

    // 3. Resolve current locations of eligible workers
    const workersWithCoords = await Promise.all(
      eligibleWorkers.map(async (worker) => {
        const redisLoc = await TrackingService.getWorkerLocation(worker.userId);
        return {
          worker,
          coords: redisLoc || { lat: worker.currentLat || 0, lng: worker.currentLng || 0 },
        };
      })
    );

    // Filter out workers who don't have valid coordinates
    const activeWorkers = workersWithCoords.filter(
      (w) => w.coords.lat !== 0 && w.coords.lng !== 0
    );

    if (activeWorkers.length === 0) {
      logger.warn(`Eligible workers found but missing coordinates in Redis`);
      return;
    }

    // 4. Batch query Google Maps Distance Matrix to get travel distance and travel ETA
    const origin = { lat: booking.pickupLat, lng: booking.pickupLng };
    const destinations = activeWorkers.map((w) => w.coords);

    const routingResults = await mapsClient.getDistanceAndDuration(origin, destinations);

    // Combine and sort by road travel duration (ETA)
    const candidates = activeWorkers
      .map((w, index) => {
        const route = routingResults[index]!;
        return {
          workerId: w.worker.id,
          userId: w.worker.userId,
          name: `${w.worker.user.firstName} ${w.worker.user.lastName}`,
          rating: w.worker.user.rating,
          etaMinutes: Math.ceil(route.durationValue / 60),
          distanceKm: Number((route.distanceValue / 1000).toFixed(1)),
        };
      })
      .sort((a, b) => a.etaMinutes - b.etaMinutes);

    logger.info(`Found ${candidates.length} candidate workers for booking ${bookingId}`);

    // 5. Broadcast job request via Socket.IO to the top 5 closest workers (waterfall targeting)
    const io = socketManager.getIO();
    const serviceNameResult = await prisma.service.findUnique({
      where: { id: booking.serviceId },
      select: { name: true },
    });

    const serviceName = serviceNameResult?.name || "Home Service";

    // Fetch worker FCM tokens to trigger background wakes
    const topCandidates = candidates.slice(0, 5);
    const candidateUserIds = topCandidates.map((c) => c.userId);
    const candidateUsers = await prisma.user.findMany({
      where: { id: { in: candidateUserIds } },
      select: { id: true, fcmToken: true },
    });

    const tokenMap = new Map(candidateUsers.map((u) => [u.id, u.fcmToken]));

    // Broadcast directly to candidate private rooms and FCM tokens
    topCandidates.forEach((candidate) => {
      // 1. WebSocket emit
      io.to(`worker:${candidate.userId}`).emit("job:broadcast", {
        bookingId: booking.id,
        serviceName,
        pickupAddress: booking.pickupAddress,
        estimatedDistance: candidate.distanceKm,
        payoutAmount: Number(booking.workerCut),
        etaMinutes: candidate.etaMinutes,
      });
      logger.debug(`Broadcasted job ${booking.id} to worker user:${candidate.userId}`);

      // 2. FCM Push Fallback
      const token = tokenMap.get(candidate.userId);
      if (token) {
        sendPushNotification(
          token,
          "New Hyperlocal Job Alert 🛠️",
          `New ${serviceName} booking available near you (ETA: ${candidate.etaMinutes} mins). Earn $${booking.workerCut}!`,
          { bookingId: booking.id }
        ).catch((err) => logger.error("FCM dispatch error:", err));
      }
    });
  }

  /**
   * Accept a booking request. Secured via Redis distributed lock.
   */
  static async acceptBooking(bookingId: string, workerUserId: string) {
    const lockKey = `booking:lock:${bookingId}`;

    // 1. Attempt to acquire Redis lock to handle concurrency
    const acquired = await redis.set(lockKey, workerUserId, "NX", "PX", 5000);

    if (acquired !== "OK") {
      const error: any = new Error("This job booking has already been accepted by another technician");
      error.statusCode = 409;
      throw error;
    }

    try {
      // 2. Fetch booking and confirm status is still PENDING
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error("Booking request not found");
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error("This booking is no longer available");
      }

      // Fetch worker profile
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: workerUserId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profilePictureUrl: true,
            },
          },
        },
      });

      if (!worker || !worker.isVerified) {
        throw new Error("Worker profile is not verified or does not exist");
      }

      if (worker.status !== WorkerStatus.IDLE) {
        throw new Error("You are currently assigned to another job");
      }

      // 3. Assign booking and transition status to ACCEPTED
      const updatedBooking = await prisma.$transaction(async (tx) => {
        // Update booking
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            workerId: worker.id,
            status: BookingStatus.ACCEPTED,
          },
          include: {
            service: true,
            customer: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        });

        // Update worker status
        await tx.workerProfile.update({
          where: { id: worker.id },
          data: {
            status: WorkerStatus.ASSIGNED,
          },
        });

        return b;
      });

      // Remove worker location from active geo-set so they aren't matched with other bookings
      await redis.zrem(`active_workers:${worker.cityId}`, workerUserId);

      // 4. Emit Socket events to coordinate matching
      const io = socketManager.getIO();

      // Join worker socket to the booking channel for location streaming
      // (Note: worker will also manually join this room when they receive this event)
      io.to(`booking:${bookingId}`).emit("job:state_changed", {
        bookingId,
        status: BookingStatus.ACCEPTED,
        worker: {
          id: worker.id,
          name: `${worker.user.firstName} ${worker.user.lastName}`,
          phone: worker.user.phoneNumber,
          photo: worker.user.profilePictureUrl,
        },
      });

      logger.info(`Booking ${bookingId} successfully accepted and assigned to worker ${worker.id}`);

      return updatedBooking;
    } catch (error) {
      // Release lock on error
      await redis.del(lockKey);
      logger.error("Error in acceptBooking process:", error);
      const err: any = new Error((error as Error).message || "Acceptance failed");
      err.statusCode = (error as any).statusCode || 500;
      throw err;
    }
  }

  /**
   * Update the status of a booking (e.g. EN_ROUTE, IN_PROGRESS, COMPLETED, CANCELLED)
   */
  static async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    workerUserId: string,
    cancellationReason?: string
  ) {
    // 1. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        worker: true,
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      const error: any = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify that the worker updating the status is the one assigned
    if (booking.worker?.userId !== workerUserId) {
      const error: any = new Error("Unauthorized status update. You are not assigned to this booking.");
      error.statusCode = 403;
      throw error;
    }

    // 2. Perform transitions
    const updated = await prisma.$transaction(async (tx) => {
      let workerStatusUpdate: WorkerStatus = WorkerStatus.ASSIGNED;
      let startedAt: Date | null = null;
      let completedAt: Date | null = null;

      if (status === BookingStatus.EN_ROUTE) {
        workerStatusUpdate = WorkerStatus.EN_ROUTE;
      } else if (status === BookingStatus.IN_PROGRESS) {
        workerStatusUpdate = WorkerStatus.IN_PROGRESS;
        startedAt = new Date();
      } else if (status === BookingStatus.COMPLETED) {
        workerStatusUpdate = WorkerStatus.IDLE;
        completedAt = new Date();

        // 3. Create Earning Log and credit worker account balance
        const netPayout = booking.workerCut;

        await tx.workerEarningLog.create({
          data: {
            workerId: booking.workerId!,
            bookingId: booking.id,
            amount: booking.totalPrice,
            netPayout,
            isSettled: false,
          },
        });

        await tx.workerProfile.update({
          where: { id: booking.workerId! },
          data: {
            totalEarnings: {
              increment: netPayout,
            },
          },
        });
      } else if (status === BookingStatus.CANCELLED) {
        workerStatusUpdate = WorkerStatus.IDLE;
      }

      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          startedAt: startedAt || undefined,
          completedAt: completedAt || undefined,
          cancellationReason: cancellationReason || undefined,
          cancelledBy: status === BookingStatus.CANCELLED ? Role.WORKER : undefined,
        },
      });

      // Update worker status
      await tx.workerProfile.update({
        where: { id: booking.workerId! },
        data: {
          status: workerStatusUpdate,
        },
      });

      return b;
    });

    // 4. If status is COMPLETED or CANCELLED, add worker back to Redis active geo index
    if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
      const workerLoc = await TrackingService.getWorkerLocation(workerUserId);
      if (workerLoc && booking.worker) {
        await TrackingService.updateWorkerLocation(
          workerUserId,
          booking.worker.cityId,
          workerLoc.lat,
          workerLoc.lng,
          workerLoc.heading
        );
      }
    }

    // 5. Broadcast status transition to rooms
    const io = socketManager.getIO();
    io.to(`booking:${bookingId}`).emit("job:state_changed", {
      bookingId,
      status,
      timestamp: new Date(),
    });

    return updated;
  }
}

export default BookingService;
