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

    // Increment the job's applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: application._id,
        jobId,
        status: application.status,
        appliedAt: application.get("createdAt"),
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
        "title location jobType workType salaryMin salaryMax status description skills experience"
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


// Get applications for my jobs (Partner only)
export const getJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: jobId } = req.params;
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
      return next(
        new ErrorResponse("Only partners can view job applications", 403)
      );
    }

    // Check if job exists and belongs to this partner
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    if (job.postedBy.toString() !== userId) {
      return next(
        new ErrorResponse(
          "Not authorized to view applications for this job",
          403
        )
      );
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { job: jobId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get applications with applicant details, including ratings and averageRating
    const applications = await Application.find(filter)
      .populate({
        path: "applicant",
        select:
          "fullName email skills experience location profilePhoto ratings averageRating",
        populate: [
          {
            path: "ratings.ratedBy",
            select: "fullName employerProfile.companyName",
          },
          { path: "ratings.job", select: "title" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        location: job.location,
        jobType: job.jobType,
      },
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

// Update application status (Partner only)
// Update application status (Partner only)
export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: applicationId } = req.params;
    const { status } = req.body;
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
      return next(new ErrorResponse("Only partners can update application status", 403));
    }

    // Find application with job details and populate applicant
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('applicant', 'fullName email username profilePhoto');
    
    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Check if this partner owns the job
    if ((application.job as any).postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to update this application", 403));
    }

    // Update application status
    application.status = status;
    await application.save();

    // If accepted, increment hires count
    if (status === "accepted") {
      await User.findByIdAndUpdate(
        userId,
        { $inc: { 'employerProfile.hiresCount': 1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      application: {
        id: application._id,
        status: application.status,
        applicant: {
          id: (application.applicant as any)._id,
          fullName: (application.applicant as any).fullName,
          email: (application.applicant as any).email,
          username: (application.applicant as any).username,
          profilePhoto: (application.applicant as any).profilePhoto
        },
        job: {
          id: (application.job as any)._id,
          title: (application.job as any).title
        },
        updatedAt: application.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single application details (Partner only)
export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: applicationId } = req.params;
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
      return next(new ErrorResponse("Only partners can view application details", 403));
    }

    // Find application with full details - INCLUDE postedBy in job population
    const application = await Application.findById(applicationId)
      .populate('applicant', 'fullName email skills experience location profilePhoto bio workExperience education certifications')
      .populate('job', 'title location jobType workType postedBy'); // ADD postedBy here

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Check if this partner owns the job - ADD null check
    if (!application.job || (application.job as any).postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to view this application", 403));
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

export const getAllJobApplications = async (
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
      return next(
        new ErrorResponse("Only partners can view job applications", 403)
      );
    }

    const { status, jobId, page = 1, limit = 10 } = req.query;

    // Get all jobs posted by this partner
    const partnerJobs = await Job.find({ postedBy: userId }).select("_id");
    const jobIds = partnerJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      res.status(200).json({
        success: true,
        applications: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0,
        },
      });
    }

    // Build filter for applications
    const filter: any = { job: { $in: jobIds } };

    // Optional filters
    if (status) {
      filter.status = status;
    }

    if (jobId) {
      filter.job = jobId; // Filter by specific job if provided
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get applications with applicant and job details
    const applications = await Application.find(filter)
      .populate(
        "applicant",
        "fullName email skills experience location profilePhoto ratings averageRating about bio workExperience education certifications otherRoles"
      )
      .populate(
        "job",
        "title location jobType workType salaryMin salaryMax currency applicationDeadline"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(filter);

    // Group applications by job for summary
    const applicationsByJob = applications.reduce(
      (
        acc: Record<string, { job: any; count: number; applications: any[] }>,
        app
      ) => {
        const jobId = app.job._id.toString();
        if (!acc[jobId]) {
          acc[jobId] = {
            job: app.job,
            count: 0,
            applications: [],
          };
        }
        acc[jobId].count++;
        acc[jobId].applications.push(app);
        return acc;
      },
      {}
    );

    // Get statistics
    const stats = {
      totalApplications: total,
      totalJobs: jobIds.length,
      pendingApplications: await Application.countDocuments({
        job: { $in: jobIds },
        status: "pending",
      }),
      reviewedApplications: await Application.countDocuments({
        job: { $in: jobIds },
        status: "reviewed",
      }),
      acceptedApplications: await Application.countDocuments({
        job: { $in: jobIds },
        status: "accepted",
      }),
      rejectedApplications: await Application.countDocuments({
        job: { $in: jobIds },
        status: "rejected",
      }),
    };

    res.status(200).json({
      success: true,
      applications,
      //applicationsByJob,
      stats,
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