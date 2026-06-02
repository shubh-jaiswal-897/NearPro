import { Request, Response, NextFunction } from "express";
import BookingService from "./booking.service";

export class BookingController {
  /**
   * POST /api/bookings
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user!.id; // from authenticate middleware
      const { serviceId, pickupLat, pickupLng, pickupAddress, durationHours } = req.body;

      const booking = await BookingService.createBooking({
        customerId,
        serviceId,
        pickupLat,
        pickupLng,
        pickupAddress,
        durationHours,
      });

      res.status(201).json({
        status: "success",
        message: "Booking requested and dispatch loop started",
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/accept
   */
  static async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerUserId = req.user!.id; // from authenticate middleware
      const { bookingId } = req.body;

      const booking = await BookingService.acceptBooking(bookingId, workerUserId);

      res.status(200).json({
        status: "success",
        message: "Booking accepted successfully",
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/bookings/status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerUserId = req.user!.id;
      const { bookingId, status, cancellationReason } = req.body;

      const booking = await BookingService.updateBookingStatus(
        bookingId,
        status,
        workerUserId,
        cancellationReason
      );

      res.status(200).json({
        status: "success",
        message: `Booking status updated to ${status}`,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: GET /api/bookings/admin/all
   */
  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await BookingService.listAllBookings();
      res.status(200).json({ status: "success", data: { bookings } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: PATCH /api/bookings/admin/:id
   */
  static async updateAdminBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, workerId, cancellationReason } = req.body;
      const booking = await BookingService.updateAdminBookingStatusAndAssignment(id, {
        status,
        workerId,
        cancellationReason,
      });

      res.status(200).json({
        status: "success",
        message: "Booking updated by admin successfully",
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: GET /api/bookings/admin/stats
   */
  static async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await BookingService.getAdminStats();
      res.status(200).json({ status: "success", data: { stats } });
    } catch (error) {
      next(error);
    }
  }
}

export default BookingController;
