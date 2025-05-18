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
  skills?: {
    fashion: boolean;
    graphicDesigner: boolean;
    videoEditor: boolean;
    contentCreator: boolean;
    photographer: boolean;
    writer: boolean;
    others: boolean;
  };
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
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
      select: false, // Don't return password in queries
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
      fashion: {
        type: Boolean,
        default: false,
      },
      graphicDesigner: {
        type: Boolean,
        default: false,
      },
      videoEditor: {
        type: Boolean,
        default: false,
      },
      contentCreator: {
        type: Boolean,
        default: false,
      },
      photographer: {
        type: Boolean,
        default: false,
      },
      writer: {
        type: Boolean,
        default: false,
      },
      others: {
        type: Boolean,
        default: false,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
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

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

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

export const User = mongoose.model<IUser>("User", UserSchema);
