// src/routes/job.routes.ts
import express from "express";
import { createJob,getMyJobs,updateJob,deleteJob, getAllJobs , createDeliverable, getJobDeliverables, updateDeliverable, deleteDeliverable} from "../controllers/job";
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

router.get("/",getAllJobs)
// Delete job
router.delete("/:id", protect, deleteJob);


router.post("/:jobId/deliverables", protect, createDeliverable);
router.get("/jobs/:jobId/deliverables", protect, getJobDeliverables);
router.put(
  "/jobs/:jobId/deliverables/:deliverableId",
  protect,
  updateDeliverable
);
router.delete(
  "/jobs/:jobId/deliverables/:deliverableId",
  protect,
  deleteDeliverable
);
export default router;
