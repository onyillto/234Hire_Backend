// src/models/user.model.ts - UPDATED WITH PARTNER SUPPORT
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// EXISTING INTERFACES - UNCHANGED
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

export interface ICertification {
  certificationName: string;
  issuingOrganization: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateImage?: string;
}

export interface IEducation {
  school: string;
  degreeType: string;
  fieldOfStudy: string;
  attachments?: string[];
}

// EMPLOYER-SPECIFIC INTERFACE (CLEANED UP)
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
  // PARTNER SPECIFIC
  projectType?: string;
}

// EXISTING USER INTERFACE - ONLY ADDITIONS
export interface IUser extends Document {
  // ALL EXISTING FIELDS - COMPLETELY UNCHANGED
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string; // Keep existing role field
  experience?: string; // Keep existing experience field
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

  // EXISTING NEW FIELDS - UNCHANGED
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

  // EMPLOYER PROFILE (NOW SUPPORTS PARTNER FIELDS TOO)
  employerProfile?: IEmployerProfile;

  // EXISTING METHODS - UNCHANGED
  getResetPasswordToken(): string;
  getSignedJwtToken(): string;
  generateEmailVerificationOTP(): string;
  generateForgotPasswordOTP(): string;
}

// EXISTING SCHEMAS - COMPLETELY UNCHANGED
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

// EMPLOYER PROFILE SCHEMA (CLEANED UP)
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
    // PARTNER SPECIFIC
    projectType: { type: String, trim: true },
  },
  { _id: false }
);

// UPDATED USER SCHEMA WITH PARTNER ROLE
const UserSchema: Schema = new Schema(
  {
    // ALL EXISTING FIELDS - EXACTLY AS YOU HAD THEM
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
    fullName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "specialist", "admin", "employer", "partner"], // ADDED "partner"
      default: "user",
    },
    experience: {
      type: String,
      enum: ["0-5", "5-10", "10+"],
    },
    about: {
      type: String,
      maxlength: [500, "About must not exceed 500 characters"],
    },
    skills: {
      type: Schema.Types.Mixed,
      default: {},
    },
    token: { type: String },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpire: {
      type: Date,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordOTP: {
      type: String,
      select: false,
    },
    forgotPasswordOTPExpire: {
      type: Date,
      select: false,
    },

    // EXISTING NEW FIELDS - UNCHANGED
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location must not exceed 100 characters"],
    },
    principalRole: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: String,
      enum: ["1", "2", "3", "4", "5+"],
    },
    otherRoles: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      maxlength: [120, "Bio must not exceed 120 characters"],
      trim: true,
    },
    profilePhoto: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    github: {
      type: String,
      trim: true,
    },
    workExperience: [WorkExperienceSchema],
    certifications: [CertificationSchema],
    education: [EducationSchema],
    resume: {
      type: String,
    },

    // EMPLOYER PROFILE (NOW SUPPORTS PARTNER FIELDS)
    employerProfile: EmployerProfileSchema,
  },
  {
    timestamps: true,
  }
);

// ALL EXISTING MIDDLEWARE & METHODS - COMPLETELY UNCHANGED
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

  console.log("🔍 Debug - Generated Email Verification OTP:", otp);
  console.log("🔍 Debug - OTP Expiry:", this.emailVerificationOTPExpire);

  return otp;
};

UserSchema.methods.generateForgotPasswordOTP = function (): string {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  this.forgotPasswordOTP = otp;
  this.forgotPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000);

  console.log("🔍 Debug - Generated Forgot Password OTP:", otp);
  console.log("🔍 Debug - OTP Expiry:", this.forgotPasswordOTPExpire);

  return otp;
};

UserSchema.methods.getSignedJwtToken = function () {
  return this._id.toString();
};

export const User = mongoose.model<IUser>("User", UserSchema);

// UPDATED HELPER FUNCTIONS FOR ROLE CHECKING
export const isEmployer = (user: IUser): boolean => {
  return user.role === "employer";
};

export const isPartner = (user: IUser): boolean => {
  return user.role === "partner";
};

export const isSkilledUser = (user: IUser): boolean => {
  return user.role === "user" || user.role === "specialist";
};

export const isAdmin = (user: IUser): boolean => {
  return user.role === "admin";
};

export const isEmployerOrPartner = (user: IUser): boolean => {
  return user.role === "employer" || user.role === "partner";
};
