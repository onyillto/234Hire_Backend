import { Request, Response, NextFunction } from "express";
import { Job } from "../models/job";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";


///CREATE JOB CONTROLLER
// @desc   Create a new job
// @route  POST /api/v1/jobs/
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is partner
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "partner") {
      return next(new ErrorResponse("Only partners can create jobs", 403));
    }

    // Check if partner completed onboarding
    if (!user.employerProfile?.companyName) {
      return next(
        new ErrorResponse("Please complete partner onboarding first", 400)
      );
    }

    // Create job
    const job = new Job({
      ...req.body,
      postedBy: userId,
      status: "draft",
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    next(error);
  }
};


// @desc   Get jobs created by the authenticated partner
// @route  GET /api/v1/jobs/my
// @access Private/Partner

export const getMyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is partner
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "partner") {
      return next(new ErrorResponse("Only partners can view their jobs", 403));
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { postedBy: userId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get jobs
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      jobs,
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


// @desc   Update a job
// @route  PUT /api/v1/jobs/:id
// @access Private/Partner
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is partner
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "partner") {
      return next(new ErrorResponse("Only partners can update jobs", 403));
    }

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if this partner owns the job
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to update this job", 403));
    }

    // Update job
    Object.assign(job, req.body);
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Check if user is partner
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.role !== "partner") {
      return next(new ErrorResponse("Only partners can delete jobs", 403));
    }

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if this partner owns the job
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to delete this job", 403));
    }

    // Delete the job
    await Job.findByIdAndDelete(id);

    // Job count will be automatically decremented by middleware in Job model

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};