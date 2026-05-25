import { z } from "zod";

export const createCitySchema = z.object({
  body: z.object({
    name: z.string().min(2, "City name is too short"),
    state: z.string().min(2, "State name is too short"),
    country: z.string().min(2, "Country name is too short"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    boundaryPoints: z
      .array(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        })
      )
      .min(3, "Geofence boundary must have at least 3 coordinates"),
    isActive: z.boolean().optional(),
  }),
});
