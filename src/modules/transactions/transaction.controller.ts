import { Request, Response, NextFunction } from "express";
import TransactionService from "./transaction.service";
import { PaymentMethod } from "@prisma/client";

export class TransactionController {
  /**
   * POST /api/transactions/intent
   */
  static async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId, paymentMethod = PaymentMethod.CARD } = req.body;

      if (!bookingId) {
        res.status(400).json({
          status: "error",
          message: "bookingId is required",
        });
        return;
      }

      const transaction = await TransactionService.createPaymentTransaction(bookingId, paymentMethod);
      
      res.status(201).json({
        status: "success",
        message: "Payment transaction initialized",
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/transactions/webhook-simulate
   * Simulates payment gateway webhook callback for local development
   */
  static async simulateWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gatewayTxnId, status = "success" } = req.body;

      if (!gatewayTxnId) {
        res.status(400).json({
          status: "error",
          message: "gatewayTxnId is required to simulate webhook",
        });
        return;
      }

      const payload = {
        event: "payment_intent.succeeded",
        simulation: true,
        status,
      };

      const result = await TransactionService.confirmPayment(gatewayTxnId, payload);

      if (!result) {
        res.status(404).json({
          status: "error",
          message: "Transaction not found",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Webhook event simulated and processed",
        data: { transaction: result },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionController;
