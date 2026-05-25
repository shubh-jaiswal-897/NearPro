import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    role: z.nativeEnum(Role).default(Role.CUSTOMER),
    profilePictureUrl: z.string().url("Invalid picture URL").optional(),
    
    // Worker specific fields (required if role is WORKER)
    cityId: z.string().uuid("Invalid City ID").optional(),
    serviceCategoryId: z.string().uuid("Invalid Service Category ID").optional(),
    verificationDocUrl: z.string().url("Invalid doc URL").optional(),
  }).refine((data) => {
    if (data.role === Role.WORKER) {
      return !!data.cityId && !!data.serviceCategoryId;
    }
    return true;
  }, {
    message: "City ID and Service Category ID are required for Worker registration",
    path: ["cityId"],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    fcmToken: z.string().optional(),
  }),
});
