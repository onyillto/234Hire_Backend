import { Request, Response, NextFunction } from "express";
import { Application } from "../models/application";
import { Job } from "../models/job";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";

export const applyForJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const userId = (req as any).user?.id;
    const { coverLetter, resumeUrl } = req.body;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is specialist
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "specialist") {
      return next(
        new ErrorResponse("Only specialists can apply for jobs", 403)
      );
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    if (job.status !== "active") {
      return next(
        new ErrorResponse("This job is not accepting applications", 400)
      );
    }

    // Check if specialist already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      return next(
        new ErrorResponse("You have already applied for this job", 400)
      );
    }

    // Check application deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return next(new ErrorResponse("Application deadline has passed", 400));
    }

    // Create application
    const application = new Application({
      job: jobId,
      applicant: userId,
      coverLetter,
      resumeUrl,
      status: "pending",
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: application._id,
        jobId,
        status: application.status,
        appliedAt: application.get('createdAt'),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is specialist
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "specialist") {
      return next(
        new ErrorResponse("Only specialists can view applications", 403)
      );
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { applicant: userId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get applications with job details
    const applications = await Application.find(filter)
      .populate(
        "job",
        "title location jobType workType salaryMin salaryMax status"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      applications,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};
