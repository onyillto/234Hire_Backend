import express from "express";
import {
  applyForJob,
  getMyApplications,
} from "../controllers/application";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { applyJobValidation } from "../vallidations/application.validation";

const router = express.Router();

// Apply for a job
router.post(
  "/jobs/:id/apply",
  protect,
  validate(applyJobValidation),
  applyForJob
);

// Get my applications
router.get("/my-applications", protect, getMyApplications);

export default router;
