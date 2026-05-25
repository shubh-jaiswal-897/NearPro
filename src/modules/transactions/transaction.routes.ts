import { Router } from "express";
import { Role } from "@prisma/client";
import TransactionController from "./transaction.controller";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";

const router = Router();

// Customer creates payment intent
router.post(
  "/intent",
  authenticate,
  requireRoles([Role.CUSTOMER]),
  TransactionController.createIntent
);

// Simulates webhook payments for test suite
router.post(
  "/webhook-simulate",
  TransactionController.simulateWebhook
);

export default router;
