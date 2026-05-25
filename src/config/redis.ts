import Redis from "ioredis";
import logger from "../utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Connected to Redis successfully");
});

redis.on("error", (error) => {
  logger.error("Redis connection error:", error);
});

export default redis;
