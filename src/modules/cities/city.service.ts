import crypto from "crypto";
import prisma from "../../config/database";
import logger from "../../utils/logger";

export interface BoundaryPoint {
  lat: number;
  lng: number;
}

export class CityService {
  /**
   * Create a new operating city with geofenced boundaries
   */
  static async createCity(data: {
    name: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
    boundaryPoints: BoundaryPoint[];
    isActive?: boolean;
  }) {
    const { name, state, country, lat, lng, boundaryPoints, isActive = true } = data;

    // Check if city name is taken
    const existing = await prisma.city.findUnique({
      where: { name },
    });

    if (existing) {
      const error: any = new Error(`City with name "${name}" already exists`);
      error.statusCode = 400;
      throw error;
    }

    // Format boundary points into WKT Polygon format: POLYGON((lng lat, lng lat, ...))
    if (boundaryPoints.length < 3) {
      const error: any = new Error("A geofence boundary must contain at least 3 points");
      error.statusCode = 400;
      throw error;
    }

    // Close the polygon if not already closed
    const coords = [...boundaryPoints];
    const first = coords[0]!;
    const last = coords[coords.length - 1]!;
    if (first.lat !== last.lat || first.lng !== last.lng) {
      coords.push(first);
    }

    const wktCoords = coords.map((p) => `${p.lng} ${p.lat}`).join(", ");
    const boundaryWKT = `POLYGON((${wktCoords}))`;

    const cityId = crypto.randomUUID();

    try {
      // Execute raw insert for PostGIS support
      await prisma.$executeRawUnsafe(`
        INSERT INTO "City" ("id", "name", "state", "country", "lat", "lng", "boundary", "isActive", "createdAt", "updatedAt")
        VALUES (
          $1, $2, $3, $4, $5, $6,
          ST_GeographyFromText($7),
          $8, NOW(), NOW()
        )
      `, cityId, name, state, country, lat, lng, boundaryWKT, isActive);

      // Fetch the created city (excluding the boundary polygon data since it's unsupported binary)
      const createdCity = await prisma.city.findUnique({
        where: { id: cityId },
      });

      return createdCity;
    } catch (error) {
      logger.error("Error creating city with geofence:", error);
      const dbError: any = new Error("Failed to create city with spatial geofence");
      dbError.statusCode = 500;
      throw dbError;
    }
  }

  /**
   * Find operating city for a specific coordinate (geofence lookup)
   */
  static async findCityByCoordinates(lat: number, lng: number): Promise<any | null> {
    try {
      // Perform PostGIS ST_Covers lookup
      const results: any[] = await prisma.$queryRawUnsafe(`
        SELECT "id", "name", "state", "country", "lat", "lng", "isActive"
        FROM "City"
        WHERE ST_Covers("boundary", ST_SetSRID(ST_Point($1, $2), 4326)::geography)
          AND "isActive" = true
        LIMIT 1
      `, lng, lat); // Order is longitude, latitude in ST_Point

      return results[0] || null;
    } catch (error) {
      logger.error("Error checking geofence coordinates:", error);
      return null;
    }
  }

  /**
   * Get all active cities
   */
  static async getActiveCities() {
    return prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        lat: true,
        lng: true,
      },
    });
  }

  /**
   * Update active status of a city
   */
  static async updateCityStatus(id: string, isActive: boolean) {
    return prisma.city.update({
      where: { id },
      data: { isActive },
    });
  }
}

export default CityService;
