// src/models/application.model.ts
import mongoose, { Document, Schema } from "mongoose";
import { IJob } from "./job";
import { IUser } from "./user";

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId; // Reference to Job
  applicant: mongoose.Types.ObjectId; // Reference to User (specialist)
  status: "pending" | "reviewed" | "accepted" | "rejected" | "withdrawn";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  hiredAt?: Date;
  rejectedAt?: Date;
  reviewedAt?: Date;
  withdrawnAt?: Date;

  // Additional application data
  proposedRate?: number; // If different from job rate
  proposedCurrency?: string;
  estimatedCompletionTime?: string; // e.g., "2 weeks", "1 month"
  availability?: string; // When can start

  // Portfolio and work samples
  portfolioItems?: Array<{
    title: string;
    description: string;
    url: string;
    type: "website" | "document" | "image" | "video" | "other";
    thumbnailUrl?: string;
  }>;

  // Experience relevance
  relevantExperience?: Array<{
    title: string;
    description: string;
    duration: string;
    skills: string[];
  }>;

  // Communication and questions
  questionsForEmployer?: string[];
  employerQuestions?: Array<{
    question: string;
    answer: string;
    answeredAt: Date;
  }>;

  // Interview and assessment
  interviewDetails?: {
    scheduled: boolean;
    scheduledAt?: Date;
    interviewType?: "video" | "phone" | "in-person" | "technical";
    interviewLink?: string;
    interviewNotes?: string;
    interviewRating?: number;
    interviewFeedback?: string;
  };

  // Assessment and tests
  assessments?: Array<{
    name: string;
    type: "technical" | "personality" | "skill" | "custom";
    score?: number;
    maxScore?: number;
    completedAt?: Date;
    feedback?: string;
    attachmentUrl?: string;
  }>;

  // Negotiation and terms
  negotiation?: {
    initialOffer?: {
      amount: number;
      currency: string;
      terms: string;
      offeredAt: Date;
    };
    counterOffer?: {
      amount: number;
      currency: string;
      terms: string;
      counteredAt: Date;
    };
    finalTerms?: {
      amount: number;
      currency: string;
      terms: string;
      agreedAt: Date;
    };
  };

  // Feedback and ratings
  employerFeedback?: {
    rating?: number;
    comment?: string;
    wouldHireAgain?: boolean;
    strengths?: string[];
    areasForImprovement?: string[];
    feedbackDate: Date;
  };

  applicantFeedback?: {
    rating?: number;
    comment?: string;
    wouldWorkAgain?: boolean;
    communicationRating?: number;
    clarityRating?: number;
    paymentRating?: number;
    feedbackDate: Date;
  };

  // Tracking and analytics
  analytics?: {
    timeToReview?: number; // hours from application to first review
    timeToDecision?: number; // hours from application to final decision
    responseTime?: number; // average response time in hours
    viewCount?: number; // how many times employer viewed application
    lastViewedAt?: Date;
  };

  // Internal notes (for admin/system use)
  internalNotes?: Array<{
    note: string;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
    type: "admin" | "system" | "employer" | "applicant";
  }>;

  // Flags and metadata
  flags?: {
    isStarred: boolean; // Employer starred this application
    isPriority: boolean; // High priority application
    hasCustomTerms: boolean; // Non-standard terms
    requiresApproval: boolean; // Needs additional approval
  };

  metadata?: Record<string, any>; // Additional flexible data
}

// Create a lean type that includes timestamps
export interface IApplicationLean {
  _id: mongoose.Types.ObjectId;
  job: any; // Will be populated
  applicant: any; // Will be populated
  status: "pending" | "reviewed" | "accepted" | "rejected" | "withdrawn";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  hiredAt?: Date;
  rejectedAt?: Date;
  reviewedAt?: Date;
  withdrawnAt?: Date;
  __v: number;
}

const ApplicationSchema: Schema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
      index: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant reference is required"],
      index: true,
      validate: {
        validator: async function (userId: mongoose.Types.ObjectId) {
          const User = mongoose.model("User");
          const user = await User.findById(userId);
          return user && ["user", "specialist"].includes(user.role);
        },
        message: "Only users and specialists can apply for jobs",
      },
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, "Cover letter must not exceed 2000 characters"],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    hiredAt: Date,
    rejectedAt: Date,
    reviewedAt: Date,
    withdrawnAt: Date,

    // Additional application data
    proposedRate: {
      type: Number,
      min: [0, "Proposed rate must be positive"],
    },
    proposedCurrency: {
      type: String,
      maxlength: [3, "Currency code must be 3 characters"],
      default: "USD",
    },
    estimatedCompletionTime: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Estimated completion time must not exceed 100 characters",
      ],
    },
    availability: {
      type: String,
      trim: true,
      maxlength: [200, "Availability must not exceed 200 characters"],
    },

    // Portfolio and work samples
    portfolioItems: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            100,
            "Portfolio item title must not exceed 100 characters",
          ],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [
            500,
            "Portfolio item description must not exceed 500 characters",
          ],
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["website", "document", "image", "video", "other"],
          default: "other",
        },
        thumbnailUrl: String,
      },
    ],

    // Experience relevance
    relevantExperience: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Experience title must not exceed 100 characters"],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            500,
            "Experience description must not exceed 500 characters",
          ],
        },
        duration: {
          type: String,
          required: true,
          trim: true,
        },
        skills: [String],
      },
    ],

    // Communication and questions
    questionsForEmployer: [
      {
        type: String,
        trim: true,
        maxlength: [300, "Question must not exceed 300 characters"],
      },
    ],
    employerQuestions: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
        answer: {
          type: String,
          required: true,
          trim: true,
        },
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Interview and assessment
    interviewDetails: {
      scheduled: { type: Boolean, default: false },
      scheduledAt: Date,
      interviewType: {
        type: String,
        enum: ["video", "phone", "in-person", "technical"],
      },
      interviewLink: String,
      interviewNotes: {
        type: String,
        maxlength: [1000, "Interview notes must not exceed 1000 characters"],
      },
      interviewRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      interviewFeedback: {
        type: String,
        maxlength: [1000, "Interview feedback must not exceed 1000 characters"],
      },
    },

    // Assessment and tests
    assessments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["technical", "personality", "skill", "custom"],
          required: true,
        },
        score: Number,
        maxScore: Number,
        completedAt: Date,
        feedback: String,
        attachmentUrl: String,
      },
    ],

    // Negotiation and terms
    negotiation: {
      initialOffer: {
        amount: Number,
        currency: String,
        terms: String,
        offeredAt: Date,
      },
      counterOffer: {
        amount: Number,
        currency: String,
        terms: String,
        counteredAt: Date,
      },
      finalTerms: {
        amount: Number,
        currency: String,
        terms: String,
        agreedAt: Date,
      },
    },

    // Feedback and ratings
    employerFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: [1000, "Feedback comment must not exceed 1000 characters"],
      },
      wouldHireAgain: Boolean,
      strengths: [String],
      areasForImprovement: [String],
      feedbackDate: {
        type: Date,
        default: Date.now,
      },
    },

    applicantFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: [1000, "Feedback comment must not exceed 1000 characters"],
      },
      wouldWorkAgain: Boolean,
      communicationRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      clarityRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      paymentRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedbackDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Tracking and analytics
    analytics: {
      timeToReview: Number,
      timeToDecision: Number,
      responseTime: Number,
      viewCount: { type: Number, default: 0 },
      lastViewedAt: Date,
    },

    // Internal notes
    internalNotes: [
      {
        note: {
          type: String,
          required: true,
          trim: true,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["admin", "system", "employer", "applicant"],
          required: true,
        },
      },
    ],

    // Flags and metadata
    flags: {
      isStarred: { type: Boolean, default: false },
      isPriority: { type: Boolean, default: false },
      hasCustomTerms: { type: Boolean, default: false },
      requiresApproval: { type: Boolean, default: false },
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Additional indexes for query performance
ApplicationSchema.index({ status: 1, appliedAt: -1 });
ApplicationSchema.index({ "flags.isStarred": 1 });
ApplicationSchema.index({ "flags.isPriority": 1 });
ApplicationSchema.index({ hiredAt: 1 });
ApplicationSchema.index({ rejectedAt: 1 });

// Middleware to increment applications count in Job
ApplicationSchema.post("save", async function (doc) {
  if (this.isNew) {
    await mongoose
      .model("Job")
      .findByIdAndUpdate(doc.job, { $inc: { applicationsCount: 1 } });

    // Update employer stats for new application
    const job = await mongoose.model("Job").findById(doc.job);
    if (job) {
      await mongoose.model("User").findByIdAndUpdate(job.postedBy, {
        $inc: { "employerProfile.hiringStats.totalApplicationsReceived": 1 },
      });
    }
  }
});

// Middleware to decrement applications count when application is deleted
ApplicationSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose
      .model("Job")
      .findByIdAndUpdate(doc.job, { $inc: { applicationsCount: -1 } });
  }
});

// Enhanced middleware to handle status changes and update statistics
ApplicationSchema.pre<IApplication>("save", async function (next) {
  const wasNew = this.isNew;
  const statusChanged = this.isModified("status");

  if (statusChanged && !wasNew) {
    const JobModel = mongoose.model<IJob>("Job");
    const UserModel = mongoose.model<IUser>("User");

    const job = await JobModel.findById(this.job);
    if (!job) {
      return next(new Error("Job not found"));
    }

    const now = new Date();

    // Ensure analytics object exists if we are going to modify it
    if (["reviewed", "accepted", "rejected"].includes(this.status)) {
      if (!this.analytics) {
        this.analytics = {};
      }
    }

    // Track status change timestamps and calculate analytics
    switch (this.status) {
      case "reviewed":
        this.reviewedAt = now;
        // We use the non-null assertion (!) because the check before the switch
        // guarantees `this.analytics` is an object for this status.
        this.analytics!.timeToReview = Math.floor(
          (now.getTime() - this.appliedAt.getTime()) / (1000 * 60 * 60)
        );
        break;

      case "rejected":
      case "accepted": {
        // We use the non-null assertion (!) here for the same reason: the logic
        // before the switch ensures `this.analytics` is defined.
        this.analytics!.timeToDecision = Math.floor(
          (now.getTime() - this.appliedAt.getTime()) / (1000 * 60 * 60)
        );

        if (this.status === "accepted") {
          this.hiredAt = now;
          // Update employer hire statistics
          await UserModel.findByIdAndUpdate(job.postedBy, {
            $inc: {
              "employerProfile.hiresCount": 1,
              "employerProfile.hiringStats.totalHires": 1,
            },
          });
          // Update job status to completed
          await JobModel.findByIdAndUpdate(this.job, {
            status: "completed",
          });
        } else {
          // Logic for 'rejected' status
          this.rejectedAt = now;
          // Update employer rejection statistics
          await UserModel.findByIdAndUpdate(job.postedBy, {
            $inc: {
              "employerProfile.rejectionsCount": 1,
              "employerProfile.hiringStats.totalRejections": 1,
            },
          });
        }
        break;
      }

      case "withdrawn":
        this.withdrawnAt = now;
        break;
    }

    // Recalculate hiring success rate for employer
    if (this.status === "accepted" || this.status === "rejected") {
      const employer = await UserModel.findById(job.postedBy);
      if (employer?.employerProfile?.hiringStats) {
        const { totalHires = 0, totalRejections = 0 } =
          employer.employerProfile.hiringStats;
        const totalDecisions = totalHires + totalRejections;

        if (totalDecisions > 0) {
          const successRate = (totalHires / totalDecisions) * 100;
          const responseRate =
            (totalDecisions /
              (employer.employerProfile.hiringStats.totalApplicationsReceived ||
                1)) *
            100;

          await UserModel.findByIdAndUpdate(job.postedBy, {
            "employerProfile.hiringStats.hiringSuccessRate":
              Math.round(successRate * 100) / 100,
            "employerProfile.hiringStats.responseRate":
              Math.round(responseRate * 100) / 100,
          });
        }
      }
    }
  }

  next();
});

// Instance methods
ApplicationSchema.methods.addPortfolioItem = function (item: {
  title: string;
  description?: string;
  url: string;
  type?: string;
  thumbnailUrl?: string;
}) {
  if (!this.portfolioItems) this.portfolioItems = [];
  this.portfolioItems.push(item);
  return this.save();
};

ApplicationSchema.methods.updateStatus = async function (
  newStatus: string,
  updatedBy: string,
  note?: string
) {
  const oldStatus = this.status;
  this.status = newStatus;

  // Add internal note about status change
  if (!this.internalNotes) this.internalNotes = [];
  this.internalNotes.push({
    note: note || `Status changed from ${oldStatus} to ${newStatus}`,
    addedBy: updatedBy,
    addedAt: new Date(),
    type: "system",
  });

  return await this.save();
};

ApplicationSchema.methods.scheduleInterview = function (details: {
  scheduledAt: Date;
  interviewType: string;
  interviewLink?: string;
}) {
  this.interviewDetails = {
    scheduled: true,
    ...details,
  };
  return this.save();
};

ApplicationSchema.methods.incrementViewCount = function () {
  if (!this.analytics) this.analytics = {};
  this.analytics.viewCount = (this.analytics.viewCount || 0) + 1;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);

// Helper functions
export const getHiredUsersForJob = (jobId: string) => {
  return Application.find({ job: jobId, status: "accepted" })
    .populate("applicant", "fullName email profilePhoto specialistProfile")
    .select("applicant hiredAt proposedRate estimatedCompletionTime");
};

export const getRejectedUsersForJob = (jobId: string) => {
  return Application.find({ job: jobId, status: "rejected" })
    .populate("applicant", "fullName email profilePhoto")
    .select("applicant rejectedAt");
};

export const getApplicationsByStatus = (jobId: string, status: string) => {
  return Application.find({ job: jobId, status })
    .populate("applicant", "fullName email profilePhoto specialistProfile")
    .sort({ appliedAt: -1 });
};

export const getJobApplicationStats = async (jobId: string) => {
  // Define the expected shape of the aggregation result for type safety.
  type ApplicationStatus = IApplication["status"];
  interface AggregationStat {
    _id: ApplicationStatus;
    count: number;
    avgTimeToDecision?: number;
  }

  const stats = await Application.aggregate<AggregationStat>([
    { $match: { job: new mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgTimeToDecision: {
          $avg: {
            $cond: {
              if: { $in: ["$status", ["accepted", "rejected"]] },
              then: "$analytics.timeToDecision",
              else: null,
            },
          },
        },
      },
    },
  ]);

  const result = {
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    avgTimeToHire: 0,
    avgTimeToReject: 0,
    totalViews: 0,
  };

  stats.forEach((stat) => {
    // This is now type-safe because TypeScript knows `stat._id` is a valid key.
    result[stat._id] = stat.count;
    if (stat._id === "accepted")
      result.avgTimeToHire = Math.round(stat.avgTimeToDecision || 0);
    if (stat._id === "rejected")
      result.avgTimeToReject = Math.round(stat.avgTimeToDecision || 0);
  });

  // Get total view count
  const viewStats = await Application.aggregate([
    { $match: { job: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: null, totalViews: { $sum: "$analytics.viewCount" } } },
  ]);

  if (viewStats.length > 0) {
    result.totalViews = viewStats[0].totalViews || 0;
  }

  return result;
};

export const getUserApplicationHistory = (
  userId: string,
  options: {
    status?: string;
    limit?: number;
    skip?: number;
  } = {}
) => {
  const query: any = { applicant: userId };

  if (options.status) {
    query.status = options.status;
  }

  return Application.find(query)
    .populate(
      "job",
      "title description company status location salaryMin salaryMax"
    )
    .sort({ appliedAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

export const bulkUpdateApplicationStatus = async (
  applicationIds: string[],
  newStatus: "accepted" | "rejected",
  updatedBy: string
) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const applications = await Application.find({
        _id: { $in: applicationIds },
        status: { $ne: newStatus },
      }).session(session);

      if (applications.length === 0) {
        return { updated: 0, alreadyProcessed: applicationIds.length };
      }

      // Update applications with status and timestamps
      const now = new Date();
      const updateData: any = {
        status: newStatus,
        [`${newStatus}At`]: now,
      };

      await Application.updateMany(
        { _id: { $in: applications.map((app) => app._id) } },
        {
          $set: updateData,
          $push: {
            internalNotes: {
              note: `Bulk status update to ${newStatus}`,
              addedBy: updatedBy,
              addedAt: now,
              type: "system",
            },
          },
        }
      ).session(session);

      return {
        updated: applications.length,
        alreadyProcessed: applicationIds.length - applications.length,
      };
    });
  } finally {
    await session.endSession();
  }
};
