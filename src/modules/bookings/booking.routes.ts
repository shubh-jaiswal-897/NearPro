import { Router } from "express";
import { Role } from "@prisma/client";
import BookingController from "./booking.controller";
import {
  createBookingSchema,
  acceptBookingSchema,
  updateBookingStatusSchema,
} from "./booking.validation";
import validate from "../../middlewares/validate";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";

const router = Router();

// Customers request bookings
router.post(
  "/",
  authenticate,
  requireRoles([Role.CUSTOMER]),
  validate(createBookingSchema),
  BookingController.create
);

// Workers accept bookings
router.post(
  "/accept",
  authenticate,
  requireRoles([Role.WORKER]),
  validate(acceptBookingSchema),
  BookingController.accept
);

// Workers update booking status (transitions)
router.patch(
  "/status",
  authenticate,
  requireRoles([Role.WORKER]),
  validate(updateBookingStatusSchema),
  BookingController.updateStatus
);

// Admin APIs (Temporarily exposed without JWT auth for local Admin App)
router.get("/admin/all", BookingController.listAll);
router.patch("/admin/:id", BookingController.updateAdminBooking);
router.get("/admin/stats", BookingController.getAdminStats);

export default router;
