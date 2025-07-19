// src/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Rating interface
export interface IRating {
  rating: number;
  ratedBy: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  comment?: string;
  ratedAt: Date;
}

// Work Experience interface
export interface IWorkExperience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  location?: string;
  employmentType?: string;
  description: string;
}

// Certification interface
export interface ICertification {
  certificationName: string;
  issuingOrganization: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateImage?: string;
}

// Education interface
export interface IEducation {
  school: string;
  degreeType: string;
  fieldOfStudy: string;
  attachments?: string[];
}

// Financial Stats interfaces
export interface IEmployerFinancialStats {
  totalSpent: number;
  totalTransactions: number;
  averageJobValue: number;
  totalJobsPosted: number;
  totalJobsCompleted: number;
  pendingPayments: number;
  lastPaymentDate?: Date;
  preferredPaymentMethod?: string;
  creditLimit?: number;
  creditUsed?: number;
}

export interface ISpecialistFinancialStats {
  totalEarned: number;
  totalTransactions: number;
  averageJobValue: number;
  totalJobsCompleted: number;
  pendingEarnings: number;
  lastPaymentReceived?: Date;
  withdrawalMethod?: string;
  totalWithdrawn: number;
  availableBalance: number;
}

// Employer Profile interface
export interface IEmployerProfile {
  companyName?: string;
  companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  industry?: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyLogo?: string;
  companyLocation?: string;
  foundedYear?: number;
  companyType?: "startup" | "corporate" | "agency" | "nonprofit" | "government";
  jobPostsCount?: number;
  hiresCount?: number;
  rejectionsCount?: number;
  projectType?: string;

  hiringStats?: {
    totalApplicationsReceived: number;
    totalHires: number;
    totalRejections: number;
    averageTimeToHire?: number;
    averageTimeToReject?: number;
    hiringSuccessRate?: number;
    responseRate?: number;
  };

  financialStats?: IEmployerFinancialStats;

  paymentSettings?: {
    preferredPaymentMethod: "credit_card" | "bank_transfer" | "paypal";
    autoPayEnabled: boolean;
    paymentTerms: "immediate" | "net_7" | "net_15" | "net_30";
    creditLimit?: number;
  };
}

// Specialist Profile interface
export interface ISpecialistProfile {
  specialization?: string;
  hourlyRate?: number;
  availability?: "full-time" | "part-time" | "contract" | "freelance";
  portfolioUrl?: string;

  financialStats?: ISpecialistFinancialStats;

  paymentSettings?: {
    preferredWithdrawalMethod: "bank_transfer" | "paypal" | "stripe";
    minimumWithdrawalAmount: number;
    taxId?: string;
    bankDetails?: {
      accountNumber?: string;
      routingNumber?: string;
      bankName?: string;
      accountHolderName?: string;
    };
  };

  performanceStats?: {
    totalJobsCompleted: number;
    averageRating: number;
    onTimeDeliveryRate: number;
    clientRetentionRate: number;
    totalReviews: number;
  };
}

// Main User interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  experience?: string;
  about?: string;
  skills?: Record<string, string>;
  token?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationOTP?: string;
  emailVerificationOTPExpire?: Date;
  isEmailVerified?: boolean;
  forgotPasswordOTP?: string;
  forgotPasswordOTPExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  principalRole?: string;
  yearsOfExperience?: string;
  otherRoles?: string[];
  bio?: string;
  profilePhoto?: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  phone?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  workExperience?: IWorkExperience[];
  certifications?: ICertification[];
  education?: IEducation[];
  resume?: string;
  employerProfile?: IEmployerProfile;
  specialistProfile?: ISpecialistProfile;
  ratings?: IRating[];
  averageRating: number;

  // Methods
  getResetPasswordToken(): string;
  getSignedJwtToken(): string;
  generateEmailVerificationOTP(): string;
  generateForgotPasswordOTP(): string;
}

// Schemas
const WorkExperienceSchema = new Schema(
  {
    jobTitle: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    currentlyWorking: { type: Boolean, default: false },
    location: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: [
        "remote",
        "full-time",
        "part-time",
        "contract",
        "freelance",
        "internship",
      ],
    },
    description: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const CertificationSchema = new Schema(
  {
    certificationName: { type: String, required: true, trim: true },
    issuingOrganization: { type: String, required: true, trim: true },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
    certificateImage: { type: String },
  },
  { _id: true }
);

const EducationSchema = new Schema(
  {
    school: { type: String, required: true, trim: true },
    degreeType: {
      type: String,
      required: true,
      enum: [
        "high-school",
        "associate",
        "bachelor",
        "master",
        "doctorate",
        "certificate",
        "diploma",
      ],
    },
    fieldOfStudy: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
  },
  { _id: true }
);

const EmployerFinancialStatsSchema = new Schema(
  {
    totalSpent: { type: Number, default: 0, min: 0 },
    totalTransactions: { type: Number, default: 0, min: 0 },
    averageJobValue: { type: Number, default: 0, min: 0 },
    totalJobsPosted: { type: Number, default: 0, min: 0 },
    totalJobsCompleted: { type: Number, default: 0, min: 0 },
    pendingPayments: { type: Number, default: 0, min: 0 },
    lastPaymentDate: Date,
    preferredPaymentMethod: String,
    creditLimit: { type: Number, min: 0 },
    creditUsed: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const SpecialistFinancialStatsSchema = new Schema(
  {
    totalEarned: { type: Number, default: 0, min: 0 },
    totalTransactions: { type: Number, default: 0, min: 0 },
    averageJobValue: { type: Number, default: 0, min: 0 },
    totalJobsCompleted: { type: Number, default: 0, min: 0 },
    pendingEarnings: { type: Number, default: 0, min: 0 },
    lastPaymentReceived: Date,
    withdrawalMethod: String,
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PaymentSettingsSchema = new Schema(
  {
    preferredPaymentMethod: {
      type: String,
      enum: ["credit_card", "bank_transfer", "paypal"],
    },
    autoPayEnabled: { type: Boolean, default: false },
    paymentTerms: {
      type: String,
      enum: ["immediate", "net_7", "net_15", "net_30"],
      default: "immediate",
    },
    creditLimit: { type: Number, min: 0 },
  },
  { _id: false }
);

const WithdrawalSettingsSchema = new Schema(
  {
    preferredWithdrawalMethod: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe"],
    },
    minimumWithdrawalAmount: { type: Number, default: 50, min: 0 },
    taxId: String,
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String,
    },
  },
  { _id: false }
);

const PerformanceStatsSchema = new Schema(
  {
    totalJobsCompleted: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    onTimeDeliveryRate: { type: Number, default: 0, min: 0, max: 100 },
    clientRetentionRate: { type: Number, default: 0, min: 0, max: 100 },
    totalReviews: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const EmployerProfileSchema = new Schema(
  {
    companyName: { type: String, trim: true },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },
    industry: { type: String, trim: true },
    companyDescription: { type: String, maxlength: 1000, trim: true },
    companyWebsite: { type: String, trim: true },
    companyLogo: { type: String },
    companyLocation: { type: String, trim: true },
    foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
    companyType: {
      type: String,
      enum: ["startup", "corporate", "agency", "nonprofit", "government"],
    },
    jobPostsCount: { type: Number, default: 0, min: 0 },
    hiresCount: { type: Number, default: 0, min: 0 },
    rejectionsCount: { type: Number, default: 0, min: 0 },
    projectType: { type: String, trim: true },

    hiringStats: {
      totalApplicationsReceived: { type: Number, default: 0, min: 0 },
      totalHires: { type: Number, default: 0, min: 0 },
      totalRejections: { type: Number, default: 0, min: 0 },
      averageTimeToHire: { type: Number, min: 0 },
      averageTimeToReject: { type: Number, min: 0 },
      hiringSuccessRate: { type: Number, min: 0, max: 100 },
      responseRate: { type: Number, min: 0, max: 100 },
    },

    financialStats: EmployerFinancialStatsSchema,
    paymentSettings: PaymentSettingsSchema,
  },
  { _id: false }
);

const SpecialistProfileSchema = new Schema(
  {
    specialization: { type: String, trim: true },
    hourlyRate: { type: Number, min: 0 },
    availability: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelance"],
    },
    portfolioUrl: { type: String, trim: true },

    financialStats: SpecialistFinancialStatsSchema,
    paymentSettings: WithdrawalSettingsSchema,
    performanceStats: PerformanceStatsSchema,
  },
  { _id: false }
);

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password must be at least 8 characters"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    fullName: { type: String, trim: true },
    role: {
      type: String,
      enum: ["user", "specialist", "admin", "employer", "partner"],
      default: "user",
    },
    experience: { type: String, enum: ["0-5", "5-10", "10+"] },
    about: {
      type: String,
      maxlength: [500, "About must not exceed 500 characters"],
    },
    skills: { type: Schema.Types.Mixed, default: {} },
    token: { type: String },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationOTP: { type: String, select: false },
    emailVerificationOTPExpire: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    forgotPasswordOTP: { type: String, select: false },
    forgotPasswordOTPExpire: { type: Date, select: false },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location must not exceed 100 characters"],
    },
    principalRole: { type: String, trim: true },
    yearsOfExperience: { type: String, enum: ["1", "2", "3", "4", "5+"] },
    otherRoles: [{ type: String, trim: true }],
    bio: {
      type: String,
      maxlength: [120, "Bio must not exceed 120 characters"],
      trim: true,
    },
    profilePhoto: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    github: { type: String, trim: true },
    workExperience: [WorkExperienceSchema],
    certifications: [CertificationSchema],
    education: [EducationSchema],
    resume: { type: String },
    employerProfile: EmployerProfileSchema,
    specialistProfile: SpecialistProfileSchema,
    ratings: [
      {
        rating: {
          type: Number,
          required: true,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating must not exceed 5"],
        },
        ratedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
          validate: {
            validator: async function (userId: mongoose.Types.ObjectId) {
              const User = mongoose.model("User");
              const user = await User.findById(userId);
              return user && ["employer", "partner"].includes(user.role);
            },
            message: "Only employers or partners can rate users",
          },
        },
        job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Comment must not exceed 500 characters"],
        },
        ratedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Virtual for averageRating
UserSchema.virtual("averageRating").get(function (this: IUser) {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const validRatings = this.ratings.filter((r) => typeof r.rating === "number");
  if (validRatings.length === 0) return 0;
  const sum = validRatings.reduce(
    (acc: number, curr: IRating) => acc + curr.rating,
    0
  );
  return Number((sum / validRatings.length).toFixed(1));
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

// Middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Methods
UserSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

UserSchema.methods.generateEmailVerificationOTP = function (): string {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  this.emailVerificationOTP = otp;
  this.emailVerificationOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

UserSchema.methods.generateForgotPasswordOTP = function (): string {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  this.forgotPasswordOTP = otp;
  this.forgotPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

UserSchema.methods.getSignedJwtToken = function () {
  return this._id.toString();
};

UserSchema.index({ "ratings.ratedBy": 1 });
UserSchema.index({ "ratings.job": 1 });

export const User = mongoose.model<IUser>("User", UserSchema);

// Helper functions
export const isEmployer = (user: IUser): boolean => user.role === "employer";
export const isPartner = (user: IUser): boolean => user.role === "partner";
export const isSkilledUser = (user: IUser): boolean =>
  user.role === "user" || user.role === "specialist";
export const isAdmin = (user: IUser): boolean => user.role === "admin";
export const isEmployerOrPartner = (user: IUser): boolean =>
  user.role === "employer" || user.role === "partner";

export const addUserRating = async (
  userId: string,
  ratedBy: string,
  jobId: string,
  rating: number,
  comment?: string
) => {
  return User.findByIdAndUpdate(
    userId,
    {
      $push: {
        ratings: {
          rating,
          ratedBy,
          job: jobId,
          comment,
          ratedAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate("ratings.ratedBy", "fullName employerProfile.companyName");
};

export const updateEmployerFinancialStats = async (
  employerId: string,
  transactionAmount: number,
  jobCompleted: boolean = false
) => {
  const updateFields: any = {
    $inc: {
      "employerProfile.financialStats.totalSpent": transactionAmount,
      "employerProfile.financialStats.totalTransactions": 1,
    },
    $set: {
      "employerProfile.financialStats.lastPaymentDate": new Date(),
    },
  };

  if (jobCompleted) {
    updateFields.$inc["employerProfile.financialStats.totalJobsCompleted"] = 1;
  }

  const user = await User.findByIdAndUpdate(employerId, updateFields, {
    new: true,
  });

  if (user?.employerProfile?.financialStats) {
    const stats = user.employerProfile.financialStats;
    const avgJobValue =
      stats.totalJobsCompleted > 0
        ? stats.totalSpent / stats.totalJobsCompleted
        : 0;

    await User.findByIdAndUpdate(employerId, {
      "employerProfile.financialStats.averageJobValue":
        Math.round(avgJobValue * 100) / 100,
    });
  }

  return user;
};

export const updateSpecialistFinancialStats = async (
  specialistId: string,
  netAmount: number,
  jobCompleted: boolean = false
) => {
  const updateFields: any = {
    $inc: {
      "specialistProfile.financialStats.totalEarned": netAmount,
      "specialistProfile.financialStats.totalTransactions": 1,
      "specialistProfile.financialStats.availableBalance": netAmount,
    },
    $set: {
      "specialistProfile.financialStats.lastPaymentReceived": new Date(),
    },
  };

  if (jobCompleted) {
    updateFields.$inc[
      "specialistProfile.financialStats.totalJobsCompleted"
    ] = 1;
    updateFields.$inc[
      "specialistProfile.performanceStats.totalJobsCompleted"
    ] = 1;
  }

  const user = await User.findByIdAndUpdate(specialistId, updateFields, {
    new: true,
  });

  if (user?.specialistProfile?.financialStats) {
    const stats = user.specialistProfile.financialStats;
    const avgJobValue =
      stats.totalJobsCompleted > 0
        ? stats.totalEarned / stats.totalJobsCompleted
        : 0;

    await User.findByIdAndUpdate(specialistId, {
      "specialistProfile.financialStats.averageJobValue":
        Math.round(avgJobValue * 100) / 100,
    });
  }

  return user;
};
