// src/models/transaction.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  // Core transaction details
  transactionId: string;
  type: "job_payment" | "withdrawal";
  status: "pending" | "completed" | "failed";

  // Financial details
  amount: number;
  currency: string;
  platformFee: number; // Fee taken by platform (e.g., 10% of amount)
  netAmount: number; // Amount after platform fee

  // Parties involved
  payer: mongoose.Types.ObjectId; // Employer
  payee: mongoose.Types.ObjectId; // Specialist
  job: mongoose.Types.ObjectId; // Related job

  // Payment method
  paymentMethod: "credit_card" | "bank_transfer" | "paypal";

  // Simple description
  description: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return `TXN_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["job_payment", "withdrawal"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    payer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "bank_transfer", "paypal"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ payer: 1 });
TransactionSchema.index({ payee: 1 });
TransactionSchema.index({ job: 1 });
TransactionSchema.index({ status: 1 });

// Middleware to set completedAt when status changes to completed
TransactionSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }
  next();
});

// Middleware to update user financial stats when transaction is completed
TransactionSchema.post("save", async function (doc) {
  if (doc.status === "completed") {
    const User = mongoose.model("User");

    // Update employer (payer) stats
    await User.findByIdAndUpdate(doc.payer, {
      $inc: {
        "employerProfile.financialStats.totalSpent": doc.amount,
        "employerProfile.financialStats.totalTransactions": 1,
        "employerProfile.financialStats.totalJobsCompleted": 1,
      },
    });

    // Update specialist (payee) stats
    await User.findByIdAndUpdate(doc.payee, {
      $inc: {
        "specialistProfile.financialStats.totalEarned": doc.netAmount,
        "specialistProfile.financialStats.totalTransactions": 1,
        "specialistProfile.financialStats.totalJobsCompleted": 1,
      },
    });
  }
});

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

// Helper function to create job payment
export const createJobPayment = async (data: {
  jobId: string;
  employerId: string;
  specialistId: string;
  amount: number;
  paymentMethod: string;
  platformFeePercentage?: number;
}) => {
  const platformFeePercentage = data.platformFeePercentage || 10; // Default 10%
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
  });

  return await transaction.save();
};

// Helper function to get user transactions
export const getUserTransactions = (userId: string) => {
  return Transaction.find({
    $or: [{ payer: userId }, { payee: userId }],
  })
    .populate("payer", "fullName employerProfile.companyName")
    .populate("payee", "fullName")
    .populate("job", "title")
    .sort({ createdAt: -1 });
};

// Helper function to get user financial summary
export const getUserFinancialSummary = async (userId: string) => {
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
      // User is the payer (employer)
      totalPaid += transaction.amount;
      totalFeesPaid += transaction.platformFee;
      completedJobs++;
    } else {
      // User is the payee (specialist)
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
};
