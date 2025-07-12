// src/models/application.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId; // Reference to Job
  applicant: mongoose.Types.ObjectId; // Reference to User (specialist)
  status: "pending" | "reviewed" | "accepted" | "rejected";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  createdAt: Date; // Explicitly add this
  updatedAt: Date; // Explicitly add this
  hiredAt?: Date; // New field for hire date
}

// Create a lean type that includes timestamps
export interface IApplicationLean {
  _id: mongoose.Types.ObjectId;
  job: any; // Will be populated
  applicant: any; // Will be populated
  status: "pending" | "reviewed" | "accepted" | "rejected";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  createdAt: Date; // Explicitly include
  updatedAt: Date; // Explicitly include
  hiredAt?: Date;
  __v: number;
}

const ApplicationSchema: Schema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant reference is required"],
      validate: {
        validator: async function (userId: mongoose.Types.ObjectId) {
          const User = mongoose.model("User");
          const user = await User.findById(userId);
          // Only specialists can apply
          return user && user.role === "specialist";
        },
        message: "Only specialists can apply for jobs",
      },
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [1000, "Cover letter must not exceed 1000 characters"],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now, // Add default value
    },
    hiredAt: {
      // New field
      type: Date,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt
  }
);

// Compound index to prevent duplicate applications
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Middleware to increment applications count in Job
ApplicationSchema.post("save", async function (doc) {
  if (this.isNew) {
    await mongoose
      .model("Job")
      .findByIdAndUpdate(doc.job, { $inc: { applicationsCount: 1 } });
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

// New middleware to update hiresCount in User and Job status
ApplicationSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "accepted") {
    this.hiredAt = new Date(); // Set hire date
    const job = await mongoose.model("Job").findById(this.job);
    if (job) {
      // Increment hiresCount for the employer/partner
      await mongoose.model("User").findByIdAndUpdate(job.postedBy, {
        $inc: { "employerProfile.hiresCount": 1 },
      });
      // Optionally update job status to "completed"
      await mongoose
        .model("Job")
        .findByIdAndUpdate(this.job, { status: "completed" });
    }
  }
  next();
});

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);

// Helper function to get hired users for a job
export const getHiredUsersForJob = (jobId: string) => {
  return Application.find({ job: jobId, status: "accepted" })
    .populate("applicant", "fullName email profilePhoto")
    .select("applicant hiredAt");
};
