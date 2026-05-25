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
    // 1. Create HTTP server wrapping Express app
    const httpServer = createServer(app);

    // 2. Initialize WebSocket manager with Socket.IO & Redis Adapter
    socketManager.init(httpServer);

    // 3. Verify Database connection
    await prisma.$connect();
    logger.info("Database connection validated successfully via Prisma ORM");

    // 4. Verify Redis connection
    await redis.ping();
    logger.info("Redis cache service validated successfully");

    // 5. Start listening
    httpServer.listen(PORT, () => {
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
