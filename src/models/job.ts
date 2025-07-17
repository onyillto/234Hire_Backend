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
  status: "active" | "reviewing" | "completed";
  applicationDeadline?: Date;
  applicationsCount: number;
  applicationEmail?: string;
  applications?: mongoose.Types.ObjectId[]; // New field to reference applications

  // Deliverables
  deliverables: Array<{
    title: string;
    description: string;
    completionPercentage: number;
    dueDate: Date;
    isCompleted: boolean;
    order: number;
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

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    // ... (all existing fields unchanged)
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title must not exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [2000, "Job description must not exceed 2000 characters"],
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
    status: {
      type: String,
      enum: ["active", "reviewing", "completed"],
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
      // New field
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
        },
        description: {
          type: String,
          required: true,
          trim: true,
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
      },
    ],
    overallCompletionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

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
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
JobSchema.index({ postedBy: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ applications: 1 }); // New index for applications

// Virtual to populate company info from User (unchanged)
JobSchema.virtual("company", {
  ref: "User",
  localField: "postedBy",
  foreignField: "_id",
  justOne: true,
  options: {
    select:
      "fullName employerProfile.companyName employerProfile.companyLogo employerProfile.industry",
  },
});

// Ensure virtual fields are serialized (unchanged)
JobSchema.set("toJSON", { virtuals: true });
JobSchema.set("toObject", { virtuals: true });

// Middleware to increment/decrement job count in User model (unchanged)
JobSchema.post("save", async function (doc) {
  if (this.isNew) {
    await mongoose.model("User").findByIdAndUpdate(doc.postedBy, {
      $inc: { "employerProfile.jobPostsCount": 1 },
    });
  }
});

JobSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose.model("User").findByIdAndUpdate(doc.postedBy, {
      $inc: { "employerProfile.jobPostsCount": -1 },
    });
    // Clean up related applications
    await mongoose.model("Application").deleteMany({ job: doc._id });
  }
});

export const Job = mongoose.model<IJob>("Job", JobSchema);

// Helper functions for job queries (updated)
export const getJobsByUser = (userId: string) => {
  return Job.find({ postedBy: userId }).sort({ createdAt: -1 });
};

export const getActiveJobs = () => {
  return Job.find({ status: "active" })
    .populate(
      "postedBy",
      "fullName employerProfile.companyName employerProfile.companyLogo"
    )
    .sort({ createdAt: -1 });
};

export const getJobsWithCompanyInfo = () => {
  return Job.find()
    .populate("company")
    .populate("applications")
    .sort({ createdAt: -1 });
};
