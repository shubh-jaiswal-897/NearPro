import prisma from "../../config/database";
import { PaymentStatus, TransactionType, PaymentMethod } from "@prisma/client";
import logger from "../../utils/logger";

export class TransactionService {
  /**
   * Create a payment transaction for a booking
   */
  static async createPaymentTransaction(bookingId: string, paymentMethod: PaymentMethod) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      const error: any = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if a successful transaction already exists
    const existingSuccess = await prisma.transaction.findFirst({
      where: {
        bookingId,
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });

    if (existingSuccess) {
      const error: any = new Error("Payment already completed successfully for this booking");
      error.statusCode = 400;
      throw error;
    }

    // Generate a mock gateway transaction ID (in production, this comes from Stripe/Razorpay)
    const gatewayTxnId = `txn_${Math.random().toString(36).substring(2, 15)}`;

    // Create pending transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        bookingId,
        amount: booking.totalPrice,
        type: TransactionType.BOOKING_PAYMENT,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        gatewayTxnId,
        gatewayPayload: { message: "Payment intent initialized" },
      },
    });

    return transaction;
  }

  /**
   * Handle payment success callback/webhook logic
   */
  static async confirmPayment(gatewayTxnId: string, gatewayPayload: any) {
    const transaction = await prisma.transaction.findUnique({
      where: { gatewayTxnId },
    });

    if (!transaction) {
      logger.error(`Webhook error: Transaction with ID ${gatewayTxnId} not found`);
      return null;
    }

    if (transaction.paymentStatus === PaymentStatus.SUCCESS) {
      return transaction; // Already processed
    }

    logger.info(`Confirming payment for transaction: ${transaction.id} | Booking: ${transaction.bookingId}`);

    // Update transaction to SUCCESS in database
    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: PaymentStatus.SUCCESS,
        gatewayPayload: {
          ...((transaction.gatewayPayload as object) || {}),
          ...gatewayPayload,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    return updated;
  }
}

export default TransactionService;
