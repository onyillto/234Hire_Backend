import { Request, Response, NextFunction } from "express";
import { Job } from "../models/job";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";

import { Application } from "../models/application";

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
      status: "active",
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

    // Get jobs with applications data
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    // Get applications for these jobs
    const jobIds = jobs.map((job) => job._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "fullName email username profilePhoto ratings averageRating location")
      .populate("job", "title")
      .lean();

    // Group applications by job and separate by status
    const jobApplicationsMap = new Map();

    applications.forEach((app) => {
      const jobId = app.job._id.toString();
      if (!jobApplicationsMap.has(jobId)) {
        jobApplicationsMap.set(jobId, {
          total: 0,
          pending: [],
          accepted: [],
          rejected: [],
          allApplications: [],
        });
      }

      const jobApps = jobApplicationsMap.get(jobId);
      jobApps.total++;
      jobApps.allApplications.push(app);

      // Group by status
      if (app.status === "accepted") {
        jobApps.accepted.push({
          id: app._id,
          applicant: app.applicant,
          
          acceptedAt: app.updatedAt,
          coverLetter: app.coverLetter,
          resumeUrl: app.resumeUrl,
        });
      } else if (app.status === "pending") {
        jobApps.pending.push({
          id: app._id,
          applicant: app.applicant,
         
          
          coverLetter: app.coverLetter,
          resumeUrl: app.resumeUrl,
        });
      } else if (app.status === "rejected") {
        jobApps.rejected.push({
          id: app._id,
          applicant: app.applicant,
          rejectedAt: app.updatedAt,
        });
      }
    });

    // Enhance jobs with application data
    const enhancedJobs = jobs.map((job) => {
      const jobApps = jobApplicationsMap.get(job._id.toString()) || {
        total: 0,
        pending: [],
        accepted: [],
        rejected: [],
      };

      return {
        ...job,
        applicationsCount: jobApps.total,
        applications: {
          total: jobApps.total,
          pending: jobApps.pending.length,
          accepted: jobApps.accepted.length,
          rejected: jobApps.rejected.length,
        },
        // Who you hired for this job
        hiredApplicants: jobApps.accepted,
        // Pending applications
        pendingApplicants: jobApps.pending,
        // Quick stats
        hasHiredApplicants: jobApps.accepted.length > 0,
        hasPendingApplicants: jobApps.pending.length > 0,
      };
    });

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      jobs: enhancedJobs,
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


/**
 * Get all jobs with filtering, pagination, and sorting
 * @route GET /api/v1/jobs
 * @access Public (for browsing) / Private (for user-specific data)
 */
export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      status,
      workType,
      experienceLevel,
      budgetMin,
      budgetMax,
      skills,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      employerId
    } = req.query;

    const userId = (req as any).user?.id;

    // Build filter object
    const filter: any = {};

    // Status filter (active, draft, completed, reviewing)
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    } else {
      // By default, only show active jobs for public viewing
      if (!userId || (req as any).user?.role !== 'partner') {
        filter.status = 'active';
      }
    }

    // Work type filter (remote, onsite, hybrid)
    if (workType) {
      if (Array.isArray(workType)) {
        filter.workType = { $in: workType };
      } else {
        filter.workType = workType;
      }
    }

    // Experience level filter
    if (experienceLevel) {
      if (Array.isArray(experienceLevel)) {
        filter.experienceLevel = { $in: experienceLevel };
      } else {
        filter.experienceLevel = experienceLevel;
      }
    }

    // Budget range filter
    if (budgetMin || budgetMax) {
      filter.budget = {};
      if (budgetMin) {
        filter.budget.$gte = parseInt(budgetMin as string);
      }
      if (budgetMax) {
        filter.budget.$lte = parseInt(budgetMax as string);
      }
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : (skills as string).split(',');
      filter.skills = { $in: skillsArray.map(skill => new RegExp(skill as string, 'i')) };
    }

    // Location filter
    if (location) {
      filter.location = new RegExp(location as string, 'i');
    }

    // Search filter (title, description, company)
    if (search) {
      filter.$or = [
        { title: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { 'employer.companyName': new RegExp(search as string, 'i') }
      ];
    }

    // Employer filter (for employer's own jobs)
    if (employerId) {
      filter.employer = employerId;
    }

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const skip = (pageNumber - 1) * pageSize;

    // Build sort object
    const sort: any = {};
    const validSortFields = ['createdAt', 'updatedAt', 'budget', 'title', 'deadline'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sort[sortField as string] = sortDirection;

    // Execute query with aggregation for better performance
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'employer',
          foreignField: '_id',
          as: 'employerDetails',
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                profilePhoto: 1,
                'employerProfile.companyName': 1,
                'employerProfile.companySize': 1,
                'employerProfile.industry': 1,
                'employerProfile.companyLocation': 1,
                ratings: 1,
                averageRating: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $addFields: {
          applicationsCount: { $size: '$applications' },
          employer: { $arrayElemAt: ['$employerDetails', 0] }
        }
      },
      {
        $project: {
          employerDetails: 0,
          applications: 0
        }
      },
      { $sort: sort },
      {
        $facet: {
          jobs: [
            { $skip: skip },
            { $limit: pageSize }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Job.aggregate(pipeline);
    const jobs = result[0].jobs;
    const totalJobs = result[0].totalCount[0]?.count || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(totalJobs / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Format response
    const response: any = {
      success: true,
      message: 'Jobs retrieved successfully',
      data: {
        jobs,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalJobs,
          pageSize,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          workType,
          experienceLevel,
          budgetRange: budgetMin || budgetMax ? { min: budgetMin, max: budgetMax } : null,
          skills: skills ? (Array.isArray(skills) ? skills : (skills as string).split(',')) : null,
          location,
          search
        }
      }
    };

    // Add user-specific data if authenticated
    if (userId) {
      // Add user's application status for each job
      const userApplications = await Job.aggregate([
        { $match: { _id: { $in: jobs.map((job: any) => job._id) } } },
        {
          $lookup: {
            from: 'applications',
            let: { jobId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$job', '$jobId'] },
                      { $eq: ['$applicant', userId] }
                    ]
                  }
                }
              }
            ],
            as: 'userApplication'
          }
        },
        {
          $project: {
            _id: 1,
            hasApplied: { $gt: [{ $size: '$userApplication' }, 0] },
            applicationStatus: { $arrayElemAt: ['$userApplication.status', 0] },
            applicationId: { $arrayElemAt: ['$userApplication._id', 0] }
          }
        }
      ]);

      // Merge user application data with jobs
      const userAppMap = new Map();
      userApplications.forEach((app: any) => {
        userAppMap.set(app._id.toString(), {
          hasApplied: app.hasApplied,
          applicationStatus: app.applicationStatus,
          applicationId: app.applicationId
        });
      });

      response.data.jobs = jobs.map((job: any) => ({
        ...job,
        userApplication: userAppMap.get(job._id.toString()) || {
          hasApplied: false,
          applicationStatus: null,
          applicationId: null
        }
      }));
    }

    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
};


// @desc   Create a new deliverable for a job
// @route  POST /api/v1/jobs/:jobId/deliverables
// @access Private/Partner
export const createDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { title, description, dueDate } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to add deliverables to this job", 403));
    }

    // Get the next order number
    const nextOrder = job.deliverables.length + 1;

    // Create new deliverable
    const newDeliverable = {
      title,
      description,
      dueDate: new Date(dueDate),
      completionPercentage: 0,
      isCompleted: false,
      order: nextOrder
    };

    // Add to job's deliverables array
    job.deliverables.push(newDeliverable);
    await job.save();

    res.status(201).json({
      success: true,
      message: "Deliverable created successfully",
      deliverable: job.deliverables[job.deliverables.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update a deliverable
// @route  PUT /api/v1/jobs/:jobId/deliverables/:deliverableId
// @access Private/Partner
export const updateDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId, deliverableId } = req.params;
    const { title, description, dueDate, completionPercentage, isCompleted } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to update this deliverable", 403));
    }

    // Find the deliverable
    const deliverable = (job.deliverables as any).id(deliverableId);
    if (!deliverable) {
      return next(new ErrorResponse("Deliverable not found", 404));
    }

    // Update fields if provided
    if (title) deliverable.title = title;
    if (description) deliverable.description = description;
    if (dueDate) deliverable.dueDate = new Date(dueDate);
    if (completionPercentage !== undefined) {
      deliverable.completionPercentage = completionPercentage;
      deliverable.isCompleted = completionPercentage === 100;
    }
    if (isCompleted !== undefined) {
      deliverable.isCompleted = isCompleted;
      if (isCompleted) deliverable.completionPercentage = 100;
    }

    // Calculate overall completion percentage
    const totalDeliverables = job.deliverables.length;
    const completedDeliverables = job.deliverables.filter(d => d.isCompleted).length;
    job.overallCompletionPercentage = Math.round((completedDeliverables / totalDeliverables) * 100);

    await job.save();

    res.status(200).json({
      success: true,
      message: "Deliverable updated successfully",
      deliverable: deliverable
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a deliverable
// @route  DELETE /api/v1/jobs/:jobId/deliverables/:deliverableId
// @access Private/Partner
export const deleteDeliverable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId, deliverableId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to delete this deliverable", 403));
    }

    // Find and remove the deliverable
    const deliverable = (job.deliverables as any).id(deliverableId);
    if (!deliverable) {
      return next(new ErrorResponse("Deliverable not found", 404));
    }

    // Remove the deliverable
    (deliverable as any).remove();

    // Reorder remaining deliverables
    job.deliverables.forEach((d, index) => {
      d.order = index + 1;
    });

    // Recalculate overall completion percentage
    if (job.deliverables.length > 0) {
      const completedDeliverables = job.deliverables.filter(d => d.isCompleted).length;
      job.overallCompletionPercentage = Math.round((completedDeliverables / job.deliverables.length) * 100);
    } else {
      job.overallCompletionPercentage = 0;
    }

    await job.save();

    res.status(200).json({
      success: true,
      message: "Deliverable deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get all deliverables for a job
// @route  GET /api/v1/jobs/:jobId/deliverables
// @access Private/Partner
export const getJobDeliverables = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Find the job
    const job = await Job.findById(jobId).select('deliverables postedBy overallCompletionPercentage');
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if user owns the job (you can modify this for hired freelancers too)
    if (job.postedBy.toString() !== userId) {
      return next(new ErrorResponse("Not authorized to view these deliverables", 403));
    }

    res.status(200).json({
      success: true,
      deliverables: job.deliverables,
      overallCompletionPercentage: job.overallCompletionPercentage
    });
  } catch (error) {
    next(error);
  }
};