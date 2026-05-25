import express from "express";
import cors from "cors";
import path from "path";
import authRouter from "./modules/auth/auth.routes";
import cityRouter from "./modules/cities/city.routes";
import serviceRouter from "./modules/services/service.routes";
import bookingRouter from "./modules/bookings/booking.routes";
import workerRouter from "./modules/workers/worker.routes";
import transactionRouter from "./modules/transactions/transaction.routes";
import errorHandler from "./middlewares/error.middleware";

export const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically for local development fallback
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Feature API Routes
app.use("/api/auth", authRouter);
app.use("/api/cities", cityRouter);
app.use("/api/services", serviceRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/workers", workerRouter);
app.use("/api/transactions", transactionRouter);

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
