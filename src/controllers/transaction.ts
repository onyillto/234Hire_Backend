// src/controllers/transaction.ts
import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/transaction";
import { ErrorResponse } from "../utils/error-response";

// @desc   Get user transactions
// @route  GET /api/v1/transactions
// @access Private
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    const transactions = await TransactionService.getUserTransactions(userId);

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get user financial summary
// @route  GET /api/v1/transactions/summary
// @access Private
export const getFinancialSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    const summary = await TransactionService.getUserFinancialSummary(userId);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
};
