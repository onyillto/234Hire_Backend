// src/services/transaction.service.ts
import { Transaction } from "../models/transaction.model";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";

export class TransactionService {
  /**
   * Create job payment transaction
   */
  public static async createJobPayment(data: {
    jobId: string;
    employerId: string;
    specialistId: string;
    amount: number;
    paymentMethod: string;
    platformFeePercentage?: number;
  }) {
    const platformFeePercentage = data.platformFeePercentage || 10;
    const platformFee = (data.amount * platformFeePercentage) / 100;
    const netAmount = data.amount - platformFee;

    const transaction = new Transaction({
      type: "job_payment",
      amount: data.amount,
      platformFee,
      netAmount,
      payer: data.employerId,
      payee: data.specialistId,
      job: data.jobId,
      paymentMethod: data.paymentMethod,
      description: `Payment for job completion`,
      status: "completed", // Auto-complete for now
    });

    return await transaction.save();
  }

  /**
   * Get user transactions
   */
  public static async getUserTransactions(userId: string) {
    return Transaction.find({
      $or: [{ payer: userId }, { payee: userId }],
    })
      .populate("payer", "fullName employerProfile.companyName")
      .populate("payee", "fullName")
      .populate("job", "title")
      .sort({ createdAt: -1 });
  }

  /**
   * Get user financial summary
   */
  public static async getUserFinancialSummary(userId: string) {
    const transactions = await Transaction.find({
      $or: [{ payer: userId }, { payee: userId }],
      status: "completed",
    });

    let totalPaid = 0;
    let totalReceived = 0;
    let totalFeesPaid = 0;
    let completedJobs = 0;

    transactions.forEach((transaction) => {
      if (transaction.payer.toString() === userId) {
        totalPaid += transaction.amount;
        totalFeesPaid += transaction.platformFee;
        completedJobs++;
      } else {
        totalReceived += transaction.netAmount;
      }
    });

    return {
      totalPaid,
      totalReceived,
      totalFeesPaid,
      completedJobs,
      totalTransactions: transactions.length,
    };
  }
}
