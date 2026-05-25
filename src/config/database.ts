import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  prisma.$on("query", (e: any) => {
    logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
  });
}

export default prisma;
