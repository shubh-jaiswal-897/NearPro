import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import socketManager from "./socket/socket.manager";
import prisma from "./config/database";
import redis from "./config/redis";
import logger from "./utils/logger";

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // 1. Verify Redis connection first (made optional for offline/Supabase setups)
    let useRedis = false;
    try {
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis connection timeout")), 1500))
      ]);
      logger.info("Redis cache service validated successfully");
      useRedis = true;
    } catch (redisError) {
      logger.warn("Redis is offline. Operating in REDIS_OFFLINE mode. Server will still run, but caching/tracking is limited.");
      redis.disconnect();
    }

    // 2. Create HTTP server wrapping Express app
    const httpServer = createServer(app);

    // 3. Initialize WebSocket manager with Socket.IO & Redis Adapter (if online)
    socketManager.init(httpServer, useRedis);

    // 4. Verify Database connection
    await prisma.$connect();
    logger.info("Database connection validated successfully via Prisma ORM");

    // 5. Start listening (bind explicitly to 0.0.0.0 for maximum compatibility on IPv4/IPv6 localhost)
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
      logger.info(`NearPro API Server is running on http://localhost:${PORT}`);
      logger.info(`WebSocket endpoint active on ws://localhost:${PORT}`);
    });

    // Handle graceful shutdowns
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      httpServer.close(async () => {
        logger.info("HTTP and WebSocket servers closed.");
        
        await prisma.$disconnect();
        logger.info("Database disconnected.");
        
        await redis.quit();
        logger.info("Redis disconnected.");
        
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    
  } catch (error) {
    logger.error("Failed to bootstrap the NearPro backend application:", error);
    process.exit(1);
  }
}

bootstrap();
