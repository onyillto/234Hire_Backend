// src/models/job.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  // Basic Job Info
  title: string;
  description: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  workType: "remote" | "onsite" | "hybrid";

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  salaryType: "hourly" | "monthly" | "yearly";

  // Requirements
  skills: string[];
  experience:
    | "entry-level"
    | "1-2 years"
    | "3-5 years"
    | "5-10 years"
    | "10+ years";
  education?:
    | "high-school"
    | "associate"
    | "bachelor"
    | "master"
    | "doctorate"
    | "not-required";

  // Company/User Relationship
  postedBy: mongoose.Types.ObjectId; // Reference to User who posted (employer/partner)

  // Job Status & Application
  status: "active" | "reviewing" | "completed" | "paused" | "cancelled"|"accepted";
  applicationDeadline?: Date;
  applicationsCount: number;
  applicationEmail?: string;
  applications?: mongoose.Types.ObjectId[]; // Reference to applications

  // Deliverables
  deliverables: Array<{
    title: string;
    description: string;
    completionPercentage: number;
    dueDate: Date;
    isCompleted: boolean;
    order: number;
    assignedTo?: mongoose.Types.ObjectId; // Reference to specialist
    completedAt?: Date;
    approvedAt?: Date;
    feedback?: string;
  }>;
  overallCompletionPercentage: number;

  // Metadata
  category?:
    | "engineering"
    | "design"
    | "marketing"
    | "sales"
    | "operations"
    | "finance"
    | "hr"
    | "customer-support"
    | "product"
    | "data"
    | "other";
  tags?: string[];

  // Job Performance & Analytics
  analytics?: {
    views: number;
    uniqueViews: number;
    applicationRate: number; // applications / views
    averageTimeToApply: number; // in hours
    sourceBreakdown: Record<string, number>; // where applicants came from
  };

  // Urgency and Priority
  priority: "low" | "normal" | "high" | "urgent";
  urgencyReason?: string;

  // Contract and Payment Terms
  contractTerms?: {
    estimatedDuration: string; // e.g., "2 weeks", "1 month"
    paymentSchedule: "milestone" | "hourly" | "fixed" | "weekly" | "monthly";
    advancePayment?: number; // percentage
    contractType: "fixed_price" | "time_based" | "milestone_based";
  };

  // Collaboration and Communication
  collaborationPreferences?: {
    communicationTools: string[]; // e.g., ["slack", "email", "zoom"]
    workingHours?: string; // e.g., "9 AM - 5 PM EST"
    timezone?: string;
    meetingFrequency:
      | "daily"
      | "weekly"
      | "bi-weekly"
      | "monthly"
      | "as-needed";
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date; // When job was made active
  pausedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

const JobSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title must not exceed 100 characters"],
      index: "text", // For text search
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [5000, "Job description must not exceed 5000 characters"],
      index: "text", // For text search
    },
    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
      maxlength: [100, "Location must not exceed 100 characters"],
      
    },
    jobType: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["full-time", "part-time", "contract", "freelance", "internship"],
      
    },
    workType: {
      type: String,
      required: [true, "Work type is required"],
      enum: ["remote", "onsite", "hybrid"],
      
    },

    // Compensation
    salaryMin: {
      type: Number,
      min: [0, "Minimum salary must be positive"],
    },
    salaryMax: {
      type: Number,
      min: [0, "Maximum salary must be positive"],
      validate: {
        validator: function (this: IJob, value: number) {
          return !this.salaryMin || value >= this.salaryMin;
        },
        message:
          "Maximum salary must be greater than or equal to minimum salary",
      },
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: [3, "Currency code must be 3 characters"],
    },
    salaryType: {
      type: String,
      enum: ["hourly", "monthly", "yearly"],
      default: "yearly",
    },

    // Requirements
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: function (skills: string[]) {
          return skills && skills.length > 0;
        },
        message: "At least one skill is required",
      },
      
    },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      enum: [
        "entry-level",
        "1-2 years",
        "3-5 years",
        "5-10 years",
        "10+ years",
      ],
      
    },
    education: {
      type: String,
      enum: [
        "high-school",
        "associate",
        "bachelor",
        "master",
        "doctorate",
        "not-required",
      ],
    },

    // Company/User Relationship
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted by user is required"],
      
      validate: {
        validator: async function (userId: mongoose.Types.ObjectId) {
          const User = mongoose.model("User");
          const user = await User.findById(userId);
          return user && ["employer", "partner"].includes(user.role);
        },
        message: "Only employers and partners can post jobs",
      },
    },

    // Job Status & Application
    status: {
      type: String,
      enum: ["active", "reviewing", "completed", "paused", "cancelled" ,"accepted"],
      default: "active",
      
    },
    applicationDeadline: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value > new Date();
        },
        message: "Application deadline must be in the future",
      },
      
    },
    applicationsCount: {
      type: Number,
      default: 0,
      min: [0, "Applications count cannot be negative"],
    },
    applicationEmail: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    applications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Application",
      },
    ],

    // Deliverables Array
    deliverables: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Deliverable title must not exceed 200 characters"],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            1000,
            "Deliverable description must not exceed 1000 characters",
          ],
        },
        completionPercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          required: true,
        },
        assignedTo: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        completedAt: Date,
        approvedAt: Date,
        feedback: {
          type: String,
          trim: true,
          maxlength: [500, "Feedback must not exceed 500 characters"],
        },
      },
    ],
    overallCompletionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Metadata
    category: {
      type: String,
      trim: true,
      enum: [
        "engineering",
        "design",
        "marketing",
        "sales",
        "operations",
        "finance",
        "hr",
        "customer-support",
        "product",
        "data",
        "other",
      ],
      
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag must not exceed 50 characters"],
      },
    ],

    // Job Performance & Analytics
    analytics: {
      views: { type: Number, default: 0, min: 0 },
      uniqueViews: { type: Number, default: 0, min: 0 },
      applicationRate: { type: Number, default: 0, min: 0, max: 100 },
      averageTimeToApply: { type: Number, default: 0, min: 0 },
      sourceBreakdown: { type: Schema.Types.Mixed, default: {} },
    },

    // Urgency and Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      
    },
    urgencyReason: {
      type: String,
      trim: true,
      maxlength: [200, "Urgency reason must not exceed 200 characters"],
    },

    // Contract and Payment Terms
    contractTerms: {
      estimatedDuration: {
        type: String,
        trim: true,
        maxlength: [100, "Estimated duration must not exceed 100 characters"],
      },
      paymentSchedule: {
        type: String,
        enum: ["milestone", "hourly", "fixed", "weekly", "monthly"],
        default: "milestone",
      },
      advancePayment: {
        type: Number,
        min: 0,
        max: 100,
      },
      contractType: {
        type: String,
        enum: ["fixed_price", "time_based", "milestone_based"],
        default: "milestone_based",
      },
    },

    // Collaboration and Communication
    collaborationPreferences: {
      communicationTools: [
        {
          type: String,
          trim: true,
        },
      ],
      workingHours: {
        type: String,
        trim: true,
        maxlength: [100, "Working hours must not exceed 100 characters"],
      },
      timezone: {
        type: String,
        trim: true,
      },
      meetingFrequency: {
        type: String,
        enum: ["daily", "weekly", "bi-weekly", "monthly", "as-needed"],
        default: "weekly",
      },
    },

    // Additional timestamps
    publishedAt: Date,
    pausedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
JobSchema.index({ postedBy: 1, createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ location: 1, status: 1 });
JobSchema.index({ jobType: 1, workType: 1 });
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ skills: 1, status: 1 });
JobSchema.index({ experience: 1, status: 1 });
JobSchema.index({ priority: 1, createdAt: -1 });
JobSchema.index({ applicationDeadline: 1 });
JobSchema.index({ applications: 1 });

// Text index for search functionality
JobSchema.index(
  {
    title: "text",
    description: "text",
    skills: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      skills: 5,
      description: 2,
      tags: 1,
    },
  }
);

// Geospatial index if you plan to add coordinates later
// JobSchema.index({ "location.coordinates": "2dsphere" });

// Virtual to populate company info from User
JobSchema.virtual("company", {
  ref: "User",
  localField: "postedBy",
  foreignField: "_id",
  justOne: true,
  options: {
    select:
      "fullName employerProfile.companyName employerProfile.companyLogo employerProfile.industry employerProfile.companyLocation",
  },
});

// Virtual to get application statistics
JobSchema.virtual("applicationStats").get(function (this: IJob) {
  return {
    totalApplications: this.applicationsCount,
    applicationRate: this.analytics?.applicationRate || 0,
    averageTimeToApply: this.analytics?.averageTimeToApply || 0,
  };
});

// Virtual to check if job is urgent
JobSchema.virtual("isUrgent").get(function (this: IJob) {
  return this.priority === "urgent" || this.priority === "high";
});

// Virtual to check if deadline is approaching (within 7 days)
JobSchema.virtual("isDeadlineApproaching").get(function (this: IJob) {
  if (!this.applicationDeadline) return false;
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffInDays =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays <= 7 && diffInDays > 0;
});

// Ensure virtual fields are serialized
JobSchema.set("toJSON", { virtuals: true });
JobSchema.set("toObject", { virtuals: true });

// Middleware to update completion percentage
JobSchema.pre<IJob>("save", function (next) {
  // Only recalculate if the deliverables array is modified.
  if (this.isModified("deliverables")) {
    if (this.deliverables && this.deliverables.length > 0) {
      const totalDeliverables = this.deliverables.length;
      const completedDeliverables = this.deliverables.filter(
        (d) => d.isCompleted
      ).length;
      this.overallCompletionPercentage =
        Math.round((completedDeliverables / totalDeliverables) * 100);
    } else {
      this.overallCompletionPercentage = 0;
    }
  }

  // Set published date when status changes to active
  if (this.isModified("status")) {
    const now = new Date();
    switch (this.status) {
      case "active":
        if (!this.publishedAt) this.publishedAt = now;
        break;
      case "paused":
        this.pausedAt = now;
        break;
      case "completed":
        this.completedAt = now;
        break;
      case "cancelled":
        this.cancelledAt = now;
        break;
    }
  }

  next();
});

// Middleware to increment job count in User model when job is created
JobSchema.post("save", async function (doc) {
  if (this.isNew) {
    await mongoose.model("User").findByIdAndUpdate(doc.postedBy, {
      $inc: {
        "employerProfile.jobPostsCount": 1,
        "employerProfile.financialStats.totalJobsPosted": 1,
      },
    });
  }
});

// Middleware to handle job deletion
JobSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    // Decrement job count
    await mongoose.model("User").findByIdAndUpdate(doc.postedBy, {
      $inc: {
        "employerProfile.jobPostsCount": -1,
        "employerProfile.financialStats.totalJobsPosted": -1,
      },
    });

    // Clean up related applications
    await mongoose.model("Application").deleteMany({ job: doc._id });

    // Clean up related notifications
    await mongoose.model("Notification").deleteMany({ relatedJob: doc._id });

    // Clean up related transactions
    await mongoose
      .model("Transaction")
      .updateMany({ job: doc._id }, { $set: { status: "cancelled" } });
  }
});

// Middleware to handle analytics updates
JobSchema.methods.incrementViews = async function (
  isUniqueView: boolean = false
) {
  this.analytics = this.analytics || {
    views: 0,
    uniqueViews: 0,
    applicationRate: 0,
    averageTimeToApply: 0,
    sourceBreakdown: {},
  };

  this.analytics.views += 1;
  if (isUniqueView) {
    this.analytics.uniqueViews += 1;
  }

  // Recalculate application rate
  if (this.analytics.views > 0) {
    this.analytics.applicationRate =
      (this.applicationsCount / this.analytics.views) * 100;
  }

  await this.save();
};

// Method to update deliverable progress
JobSchema.methods.updateDeliverableProgress = async function (
  deliverableId: string,
  updates: {
    completionPercentage?: number;
    isCompleted?: boolean;
    feedback?: string;
    assignedTo?: string;
  }
) {
  const deliverable = this.deliverables.id(deliverableId);
  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  Object.assign(deliverable, updates);

  if (updates.isCompleted === true && !deliverable.completedAt) {
    deliverable.completedAt = new Date();
  }

  await this.save();
  return deliverable;
};

export const Job = mongoose.model<IJob>("Job", JobSchema);

// Helper functions for job queries
export const getJobsByUser = (userId: string, status?: string) => {
  const query: any = { postedBy: userId };
  if (status) query.status = status;

  return Job.find(query).populate("applications").sort({ createdAt: -1 });
};

export const getActiveJobs = (filters?: {
  location?: string;
  jobType?: string;
  workType?: string;
  experience?: string;
  skills?: string[];
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
}) => {
  const query: any = { status: "active" };

  if (filters) {
    if (filters.location) {
      query.location = new RegExp(filters.location, "i");
    }
    if (filters.jobType) {
      query.jobType = filters.jobType;
    }
    if (filters.workType) {
      query.workType = filters.workType;
    }
    if (filters.experience) {
      query.experience = filters.experience;
    }
    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.salaryMin) {
      query.salaryMin = { $gte: filters.salaryMin };
    }
    if (filters.salaryMax) {
      query.salaryMax = { $lte: filters.salaryMax };
    }
  }

  return Job.find(query)
    .populate("company")
    .sort({ priority: -1, createdAt: -1 });
};

export const getJobsWithCompanyInfo = () => {
  return Job.find()
    .populate("company")
    .populate("applications")
    .sort({ createdAt: -1 });
};

export const searchJobs = (
  searchQuery: string,
  filters?: any,
  sortBy: string = "relevance"
) => {
  const query: any = {
    status: "active",
    $text: { $search: searchQuery },
  };

  // Apply additional filters
  if (filters) {
    Object.assign(query, filters);
  }

  let sortOptions: any = {};

  switch (sortBy) {
    case "relevance":
      sortOptions = { score: { $meta: "textScore" } };
      break;
    case "newest":
      sortOptions = { createdAt: -1 };
      break;
    case "oldest":
      sortOptions = { createdAt: 1 };
      break;
    case "salary_high":
      sortOptions = { salaryMax: -1 };
      break;
    case "salary_low":
      sortOptions = { salaryMin: 1 };
      break;
    case "deadline":
      sortOptions = { applicationDeadline: 1 };
      break;
    default:
      sortOptions = { score: { $meta: "textScore" } };
  }

  return Job.find(query)
    .select({ score: { $meta: "textScore" } })
    .populate("company")
    .sort(sortOptions);
};

export const getJobAnalytics = async (jobId: string) => {
  const job = await Job.findById(jobId).populate("applications");

  if (!job) return null;

  const applications = await mongoose.model("Application").find({ job: jobId });

  const analytics = {
    views: job.analytics?.views || 0,
    uniqueViews: job.analytics?.uniqueViews || 0,
    applications: applications.length,
    applicationRate: job.analytics?.applicationRate || 0,
    averageTimeToApply: job.analytics?.averageTimeToApply || 0,
    statusBreakdown: {
      pending: applications.filter((app) => app.status === "pending").length,
      reviewed: applications.filter((app) => app.status === "reviewed").length,
      accepted: applications.filter((app) => app.status === "accepted").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    },
    deliverableProgress: {
      total: job.deliverables.length,
      completed: job.deliverables.filter((d) => d.isCompleted).length,
      overallPercentage: job.overallCompletionPercentage,
    },
  };

  return analytics;
};

export const getUpcomingDeadlines = (userId: string, days: number = 7) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return Job.find({
    postedBy: userId,
    status: "active",
    applicationDeadline: {
      $gte: new Date(),
      $lte: futureDate,
    },
  }).sort({ applicationDeadline: 1 });
};
