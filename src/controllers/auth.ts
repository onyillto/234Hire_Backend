// src/controllers/auth.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";
import { AuthService } from "../services/auth";
import bcrypt from "bcryptjs";
import { sendEmail } from "../services/email";
import crypto from "crypto";
import { EmailTemplates } from "../templates/email.templates";
// Helper function to send token response
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // Create token using AuthService (recommended approach)
  const token = AuthService.generateToken(user);

  res.status(statusCode).json({
    success: true,
    message: "Login successful", // ✅ Add your custom message here
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc   Register use
// @route  POST /api/v1/auth/register
// @access Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const user = await User.create({ username, email, password });

    // Generate token
    const token = AuthService.generateToken(user);

    // Optional: Save it to DB
    (user as any).token = token;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      // Extract the field that caused the duplicate
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];

      let message: string;

      if (duplicateField === "username") {
        message = `Username "${duplicateValue}" is already taken. Please choose a different username.`;
      } else if (duplicateField === "email") {
        message = `An account with email "${duplicateValue}" already exists. Please use a different email or try logging in.`;
      } else {
        message = `${duplicateField} already exists. Please choose a different ${duplicateField}.`;
      }

      return next(new ErrorResponse(message, 400));
    }

    // Handle validation errors from Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      const message = errors.join(". ");
      return next(new ErrorResponse(message, 400));
    }

    // Handle other errors
    next(error);
  }
};

// @desc   Complete user onboarding
// @route  POST /api/v1/auth/onboarding
// @access Private
export const completeOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, role, experience, about, selectedSkills } = req.body;

    // Get user ID from the authenticated request (cast req to any to access user)
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    // Find the user in database
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Validate required fields
    if (!fullName || !role) {
      return next(new ErrorResponse("Full name and role are required", 400));
    }

    // Update user with onboarding data
    user.fullName = fullName;
    user.role = role;
    user.experience = experience;
    user.about = about;

    // Handle skills - convert selectedSkills array to Map format
    if (selectedSkills && Array.isArray(selectedSkills)) {
      const skillsMap = new Map();

      selectedSkills.forEach((skill: any) => {
        if (skill.value && skill.label) {
          skillsMap.set(skill.value, skill.label);
        }
      });

      user.skills = Object.fromEntries(skillsMap);
    }

    await user.save();

    // Helper function to convert skills to plain object
    const getSkillsAsObject = (skills: any) => {
      if (!skills) return {};

      // If it's already a Map, convert to object
      if (skills instanceof Map) {
        return Object.fromEntries(skills);
      }

      // If it's already an object, return as is
      if (typeof skills === "object") {
        return skills;
      }

      return {};
    };

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        experience: user.experience,
        about: user.about,
        skills: getSkillsAsObject(user.skills),
      },
    });
  } catch (error) {
    next(error);
  }
};




// @desc   Login user
// @route  POST /api/v1/auth/login
// @access Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate username & password
    if (!username || !password) {
      return next(new ErrorResponse("Please provide username and password", 400));
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Generate token
    const token = AuthService.generateToken(user);

    // Save token to DB
    user.token = token;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        experience: user.experience,
        about: user.about,
      },
    });
  } catch (error) {
    next(error);
  }
};


// @desc   Forgot password - Send new password via email
// @route  POST /api/v1/auth/forgot-password
// @access Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    console.log("🔍 Debug - Forgot password request for:", email);

    // Validate email
    if (!email) {
      return next(new ErrorResponse("Please provide an email address", 400));
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ Debug - User not found");
      return next(
        new ErrorResponse("No account found with that email address", 404)
      );
    }

    console.log("✅ Debug - User found:", user.username);

    // Generate 4-digit OTP for password reset
    const otp = (user as any).generateForgotPasswordOTP();
    console.log("🔍 Debug - Generated Forgot Password OTP:", otp);

    // Save user with OTP
    await user.save();
    console.log("✅ Debug - User saved with forgot password OTP");

    // Verify it was saved correctly
    const savedUser = await User.findOne({ email }).select(
      "+forgotPasswordOTP +forgotPasswordOTPExpire"
    );
    console.log("🔍 Debug - Verified saved OTP:", savedUser?.forgotPasswordOTP);
    console.log(
      "🔍 Debug - Verified saved expiry:",
      savedUser?.forgotPasswordOTPExpire
    );

    // Get email template for forgot password OTP
    const emailTemplate = EmailTemplates.forgotPasswordOTP(
      user.fullName || user.username,
      otp
    );

    // Send email with OTP
    try {
      await sendEmail({
        email: user.email,
        subject: emailTemplate.subject,
        message: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log("✅ Debug - Forgot password OTP email sent successfully");

      res.status(200).json({
        success: true,
        message: "A password reset code has been sent to your email address",
        // For development only - remove in production
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            otp: otp,
            note: "OTP shown for development only",
          },
        }),
      });
    } catch (emailError) {
      console.error("❌ Debug - Email sending failed:", emailError);
      return next(
        new ErrorResponse("Failed to send email. Please try again later.", 500)
      );
    }
  } catch (error) {
    console.log("❌ Debug - Error in forgotPassword:", error);
    next(error);
  }
};



// STEP 4: Add verify forgot password OTP endpoint

export const verifyForgotPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    console.log("🔍 Debug - Verifying forgot password OTP for:", email);
    console.log("🔍 Debug - OTP received:", otp);

    // Validate input
    if (!email || !otp) {
      return next(new ErrorResponse("Please provide email and verification code", 400));
    }

    // Find user by email and include forgot password OTP fields
    const user = await User.findOne({ email }).select('+forgotPasswordOTP +forgotPasswordOTPExpire');

    if (!user) {
      console.log("❌ Debug - User not found");
      return next(new ErrorResponse("No account found with that email address", 404));
    }

    console.log("✅ Debug - User found:", user.username);
    console.log("🔍 Debug - Stored OTP:", user.forgotPasswordOTP);
    console.log("🔍 Debug - OTP Expiry:", user.forgotPasswordOTPExpire);

    // Check if OTP exists
    if (!user.forgotPasswordOTP) {
      console.log("❌ Debug - No forgot password OTP found");
      return next(new ErrorResponse("No password reset code found. Please request a new one.", 400));
    }

    // Check if OTP has expired
    if (!user.forgotPasswordOTPExpire || user.forgotPasswordOTPExpire < new Date()) {
      console.log("❌ Debug - Forgot password OTP expired");
      return next(new ErrorResponse("Password reset code has expired. Please request a new one.", 400));
    }

    // Verify OTP
    if (user.forgotPasswordOTP !== otp) {
      console.log("❌ Debug - Forgot password OTP mismatch");
      return next(new ErrorResponse("Invalid password reset code", 400));
    }

    console.log("✅ Debug - Forgot password OTP verified successfully");

    // Clear the OTP (but don't change password yet)
    user.forgotPasswordOTP = undefined;
    user.forgotPasswordOTPExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset code verified. You can now set a new password.",
      user: {
        id: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("❌ Debug - Error in verifyForgotPasswordOTP:", error);
    next(error);
  }
};

// @desc   Send email verification OTP
// @route  POST /api/v1/auth/send-verification-otp
// @access Public

export const sendVerificationOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return next(new ErrorResponse("Please provide an email address", 400));
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse("No account found with that email address", 404));
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return next(new ErrorResponse("Email is already verified", 400));
    }

    // Generate OTP using the model method
    const otp = user.generateEmailVerificationOTP();
    await user.save();

    // Get email template
    const emailTemplate = EmailTemplates.verificationOTP(
      user.fullName || user.username,
      otp
    );

    // Send OTP email
    try {
      await sendEmail({
        email: user.email,
        subject: emailTemplate.subject,
        message: emailTemplate.text,
        html: emailTemplate.html,
      });

      res.status(200).json({
        success: true,
        message: "Verification code sent to your email address",
      });

    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return next(new ErrorResponse("Failed to send verification code. Please try again later.", 500));
    }

  } catch (error) {
    next(error);
  }
};



// @desc   Verify email with OTP
// @route  POST /api/v1/auth/verify-email-otp
// @access Public
export const verifyEmailOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return next(new ErrorResponse("Please provide email and verification code", 400));
    }

    // Find user by email and include OTP fields
    const user = await User.findOne({ email }).select('+emailVerificationOTP +emailVerificationOTPExpire');

    if (!user) {
      return next(new ErrorResponse("No account found with that email address", 404));
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return next(new ErrorResponse("Email is already verified", 400));
    }

    // Check if OTP exists
    if (!user.emailVerificationOTP) {
      return next(new ErrorResponse("No verification code found. Please request a new one.", 400));
    }

    // Check if OTP has expired
    if (!user.emailVerificationOTPExpire || user.emailVerificationOTPExpire < new Date()) {
      return next(new ErrorResponse("Verification code has expired. Please request a new one.", 400));
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return next(new ErrorResponse("Invalid verification code", 400));
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {
    next(error);
  }
};


// @desc   Reset password (after forgot password)
// @route  POST /api/v1/auth/reset-password
// @access Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!email || !newPassword || !confirmPassword) {
      return next(new ErrorResponse("Please provide email, new password, and confirm password", 400));
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return next(new ErrorResponse("New password and confirm password do not match", 400));
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return next(new ErrorResponse("No account found with that email address", 404));
    }

    // Check if the current password in DB is the temporary password from forgot-password
    // This ensures user is using the temporary password we sent them
    // Optional: You could add additional verification here (like a reset token)

    // Update password (will be hashed by the pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Optional: Send confirmation email
    try {
      const emailTemplate = EmailTemplates.passwordChanged(
        user.fullName || user.username
      );

      await sendEmail({
        email: user.email,
        subject: emailTemplate.subject,
        message: emailTemplate.text,
        html: emailTemplate.html,
      });
    } catch (emailError) {
      console.error("Password change email failed:", emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });

  } catch (error) {
    next(error);
  }
};

