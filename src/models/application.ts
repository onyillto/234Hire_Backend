import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId; // Reference to Job
  applicant: mongoose.Types.ObjectId; // Reference to User (specialist)
  status: "pending" | "reviewed" | "accepted" | "rejected";
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  updatedAt: Date;
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
  },
  {
    timestamps: true,
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

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);
