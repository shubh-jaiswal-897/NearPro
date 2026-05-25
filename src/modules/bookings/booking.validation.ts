import { z } from "zod";
import { BookingStatus } from "@prisma/client";

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().uuid("Invalid service ID"),
    pickupLat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
    pickupLng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
    pickupAddress: z.string().min(5, "Address must be at least 5 characters long"),
  }),
});

export const acceptBookingSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("Invalid booking ID"),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("Invalid booking ID"),
    status: z.nativeEnum(BookingStatus),
    cancellationReason: z.string().optional(),
  }),
});
