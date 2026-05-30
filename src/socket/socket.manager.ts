import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { redis } from "../config/redis";
import logger from "../utils/logger";
import { registerSocketHandlers } from "./socket.handlers";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email: string;
      role: Role;
    };
  };
}

class SocketManager {
  private io: Server | null = null;

  init(server: HttpServer, useRedis: boolean = false) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    if (useRedis) {
      try {
        // Configure horizontal scalability adapter using Redis Pub/Sub client duplicates
        const pubClient = redis.duplicate();
        const subClient = redis.duplicate();
        
        pubClient.on("error", (err) => {
          logger.error("Redis pubClient error:", err);
        });
        subClient.on("error", (err) => {
          logger.error("Redis subClient error:", err);
        });

        this.io.adapter(createAdapter(pubClient, subClient));
        logger.info("Socket.IO Redis Adapter configured successfully");
      } catch (err) {
        logger.error("Failed to initialize Socket.IO Redis adapter:", err);
      }
    } else {
      logger.info("Operating in REDIS_OFFLINE mode. Socket.IO using default In-Memory adapter.");
    }

    // JWT Authentication middleware for WebSocket handshakes
    this.io.use((socket: Socket, next) => {
      const authHeader = socket.handshake.headers.authorization;
      const token = socket.handshake.auth?.token || (authHeader && authHeader.split(" ")[1]);

      if (!token) {
        logger.warn(`Connection handshake rejected: Authentication token missing (Socket ID: ${socket.id})`);
        return next(new Error("Authentication token is required"));
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          email: string;
          role: Role;
        };

        socket.data.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        logger.warn(`Connection handshake rejected: Invalid JWT token (Socket ID: ${socket.id})`);
        next(new Error("Authentication token is invalid or expired"));
      }
    });

    // Listen for client connections
    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const user = authSocket.data.user!;
      
      logger.info(
        `Socket Connected: ID ${socket.id} | User ${user.id} | Role ${user.role}`
      );

      // Register feature-specific events handlers
      registerSocketHandlers(authSocket, this.io!);
    });

    return this.io;
  }

  getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.IO has not been initialized. Call init() first.");
    }
    return this.io;
  }
}

export const socketManager = new SocketManager();
export default socketManager;
