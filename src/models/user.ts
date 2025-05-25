// src/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  experience?: string;
  about?: string;
  skills?: Record<string, string>; // dynamic skill keys
  token?: string; // for JWT token storage
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  // Email verification OTP fields
  emailVerificationOTP?: string;
  emailVerificationOTPExpire?: Date;
  isEmailVerified?: boolean;
  // Forgot password OTP fields
  forgotPasswordOTP?: string;
  forgotPasswordOTPExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  getResetPasswordToken(): string;
  getSignedJwtToken(): string;
  generateEmailVerificationOTP(): string;
  generateForgotPasswordOTP(): string;
}

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
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    fullName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "specialist", "admin"],
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
      type: Map,
      of: String,
      default: {},
    },
    token: { type: String },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Email verification OTP fields
    emailVerificationOTP: {
      type: String,
      select: false, // Don't return OTP in queries by default
    },
    emailVerificationOTPExpire: {
      type: Date,
      select: false, // Don't return expiry in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Forgot password OTP fields
    forgotPasswordOTP: {
      type: String,
      select: false, // Don't return OTP in queries by default
    },
    forgotPasswordOTPExpire: {
      type: Date,
      select: false, // Don't return expiry in queries by default
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification OTP - 4 DIGITS
UserSchema.methods.generateEmailVerificationOTP = function (): string {
  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Set OTP and expiration (10 minutes)
  this.emailVerificationOTP = otp;
  this.emailVerificationOTPExpire = new Date(Date.now() + 10 * 60 * 1000);

  console.log("🔍 Debug - Generated Email Verification OTP:", otp);
  console.log("🔍 Debug - OTP Expiry:", this.emailVerificationOTPExpire);

  return otp;
};

// Generate forgot password OTP - 4 DIGITS
UserSchema.methods.generateForgotPasswordOTP = function (): string {
  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Set OTP and expiration (10 minutes)
  this.forgotPasswordOTP = otp;
  this.forgotPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000);

  console.log("🔍 Debug - Generated Forgot Password OTP:", otp);
  console.log("🔍 Debug - OTP Expiry:", this.forgotPasswordOTPExpire);

  return otp;
};

// Sign JWT and return - using AuthService
UserSchema.methods.getSignedJwtToken = function () {
  // We'll handle token generation in the controller using AuthService
  // This method just returns the user ID for now
  return this._id.toString();
};

export const User = mongoose.model<IUser>("User", UserSchema);
