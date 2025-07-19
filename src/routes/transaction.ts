import express from "express";
import { protect } from "../middlewares/auth";
import {
  getTransactions,
  getFinancialSummary,
} from "../controllers/transaction";

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/", getTransactions);
router.get("/summary", getFinancialSummary);

export default router;
