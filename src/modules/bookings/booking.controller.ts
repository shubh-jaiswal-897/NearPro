import { Request, Response, NextFunction } from "express";
import BookingService from "./booking.service";

export class BookingController {
  /**
   * POST /api/bookings
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user!.id; // from authenticate middleware
      const { serviceId, pickupLat, pickupLng, pickupAddress } = req.body;

      const booking = await BookingService.createBooking({
        customerId,
        serviceId,
        pickupLat,
        pickupLng,
        pickupAddress,
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
}

export default BookingController;
