// src/routes/index.ts
import express, { application } from "express";
import authRoutes from "./auth";
 import profileRoutes from "./profile";
import jobsRoute from './job'
import applicationRoutes from "./application";
const router = express.Router();

// Base routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/jobs", jobsRoute);
router.use("/application", applicationRoutes);
export default router;
