// src/routes/job.routes.ts
import express from "express";
import { createJob,getMyJobs,updateJob,deleteJob } from "../controllers/job";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  createJobValidation,
  updateJobValidation,
} from "../vallidations/job.validation";

const router = express.Router();

router.post("/create", protect, validate(createJobValidation), createJob);

// Get my jobs
router.get("/my-jobs", protect, getMyJobs);

router.put("/:id", protect, validate(updateJobValidation), updateJob);


// Delete job
router.delete("/:id", protect, deleteJob);
export default router;
