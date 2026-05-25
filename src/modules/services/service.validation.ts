import { z } from "zod";
import { PriceType } from "@prisma/client";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    description: z.string().optional(),
    iconUrl: z.string().url("Invalid icon URL").optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid("Invalid category ID"),
    name: z.string().min(2, "Service name must be at least 2 characters"),
    description: z.string().optional(),
    priceType: z.nativeEnum(PriceType).default(PriceType.FIXED),
    isActive: z.boolean().optional(),
  }),
});

export const setPricingSchema = z.object({
  body: z.object({
    cityId: z.string().uuid("Invalid city ID"),
    serviceId: z.string().uuid("Invalid service ID"),
    basePrice: z.number().nonnegative("Base price must be a non-negative number"),
    pricePerKm: z.number().nonnegative("Price per km must be a non-negative number"),
    pricePerMinute: z.number().nonnegative("Price per minute must be a non-negative number"),
    minimumPrice: z.number().nonnegative("Minimum price must be a non-negative number"),
    platformFee: z.number().nonnegative("Platform fee must be a non-negative number").optional(),
  }),
});
