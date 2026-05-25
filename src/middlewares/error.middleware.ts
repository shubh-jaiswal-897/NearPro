import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.url} - Error: ${message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    status: "error",
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
