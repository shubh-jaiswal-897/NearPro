import { redis } from "../../config/redis";
import { prisma } from "../../config/database";
import logger from "../../utils/logger";

function calculateHaversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
}

export interface NearbyWorkerResult {
  workerId: string;
  distance: number; // in kilometers
}

export class TrackingService {
  /**
   * Update active worker location in Redis Geo Set and set heartbeat TTL
   */
  static async updateWorkerLocation(
    workerId: string,
    cityId: string,
    lat: number,
    lng: number,
    heading?: number
  ): Promise<void> {
    try {
      const geoKey = `active_workers:${cityId}`;
      const heartbeatKey = `worker:heartbeat:${workerId}`;
      const metadataKey = `worker:metadata:${workerId}`;

      // 1. Add coordinates to Redis Geo index (longitude, latitude)
      await redis.geoadd(geoKey, lng, lat, workerId);

      // 2. Save heading and current position metadata as JSON string (TTL 30s)
      await redis.set(
        metadataKey,
        JSON.stringify({ lat, lng, heading: heading || 0, updatedAt: Date.now() }),
        "EX",
        30
      );

      // 3. Set heartbeat key (value is cityId, so we know which Geo set to clean up)
      await redis.set(heartbeatKey, cityId, "EX", 30);

      logger.debug(
        `Updated worker location in Redis: Worker ${workerId} | City ${cityId} | Lat ${lat} | Lng ${lng}`
      );
    } catch (error) {
      logger.error(`Failed to update worker location in Redis for worker ${workerId}:`, error);
    }
  }

  /**
   * Retrieve active worker current location from Redis metadata
   */
  static async getWorkerLocation(workerId: string): Promise<{ lat: number; lng: number; heading: number } | null> {
    try {
      const data = await redis.get(`worker:metadata:${workerId}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error fetching worker location from Redis:`, error);
      return null;
    }
  }

  /**
   * Remove worker from Redis active sets (on go-offline or socket disconnect)
   */
  static async removeWorker(workerId: string): Promise<void> {
    try {
      const heartbeatKey = `worker:heartbeat:${workerId}`;
      const cityId = await redis.get(heartbeatKey);

      if (cityId) {
        const geoKey = `active_workers:${cityId}`;
        await redis.zrem(geoKey, workerId);
      }

      await redis.del(heartbeatKey);
      await redis.del(`worker:metadata:${workerId}`);
      logger.info(`Removed worker ${workerId} from active tracking`);
    } catch (error) {
      logger.error(`Failed to remove worker ${workerId} from active tracking:`, error);
    }
  }

  /**
   * Search nearby workers within a given radius in kilometers using Redis GeoSearch
   */
  static async findNearbyWorkers(
    cityId: string,
    lat: number,
    lng: number,
    radiusInKm: number = 5
  ): Promise<NearbyWorkerResult[]> {
    try {
      // Fallback: If Redis is offline/disconnected, find online IDLE workers in DB and calculate distance manually
      if (redis.status !== "ready") {
        logger.warn("Redis is offline. Performing geospatial query via fallback DB query.");
        const workers = await prisma.workerProfile.findMany({
          where: {
            cityId,
            isOnline: true,
            status: "IDLE",
            currentLat: { not: null },
            currentLng: { not: null },
          },
        });

        const results: NearbyWorkerResult[] = [];
        for (const worker of workers) {
          if (worker.currentLat && worker.currentLng) {
            const distance = calculateHaversineDistance(
              { lat, lng },
              { lat: worker.currentLat, lng: worker.currentLng }
            );
            if (distance <= radiusInKm) {
              results.push({
                workerId: worker.userId,
                distance,
              });
            }
          }
        }
        return results.sort((a, b) => a.distance - b.distance);
      }

      const geoKey = `active_workers:${cityId}`;

      // Run Redis GEOSEARCH query
      // Format: GEOSEARCH key FROMLONLAT lng lat BYRADIUS radius km WITHDIST ASC
      // ioredis supports geosearch directly
      const results = (await redis.send_command(
        "GEOSEARCH",
        geoKey,
        "FROMLONLAT",
        lng,
        lat,
        "BYRADIUS",
        radiusInKm,
        "km",
        "WITHDIST",
        "ASC"
      )) as Array<[string, string]>;

      if (!results || !Array.isArray(results)) {
        return [];
      }

      return results.map(([workerId, distanceStr]) => ({
        workerId,
        distance: parseFloat(distanceStr),
      }));
    } catch (error) {
      logger.error(`Error querying nearby workers in Redis for city ${cityId}:`, error);
      return [];
    }
  }
}

export default TrackingService;
