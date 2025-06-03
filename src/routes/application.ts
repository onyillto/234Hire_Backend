import express from "express";
import {
  applyForJob,
  getMyApplications,
    getJobApplications,
    getApplicationById,
    updateApplicationStatus,
} from "../controllers/application";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  applyJobValidation,
  updateApplicationStatusValidation,
} from "../vallidations/application.validation";

const router = express.Router();


// Specialist routes
// Apply for a job
router.post(
  "/jobs/:id/apply",
  protect,
  validate(applyJobValidation),
  applyForJob
);

// Get my applications
router.get("/my-applications", protect, getMyApplications);




// Partner routes
router.get("/jobs/:id/applications", protect, getJobApplications);
router.get("/:id", protect, getApplicationById);
router.put("/:id/status", protect, validate(updateApplicationStatusValidation), updateApplicationStatus);

export default router;
