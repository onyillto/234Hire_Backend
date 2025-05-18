// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user";
import { sendEmail } from "../services/email";
import { ErrorResponse } from "../utils/error-response";
import logger from "../utils/logger";

// @desc   Register user
// @route  POST /api/v1/auth/register
// @access Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Send token response
    sendTokenResponse(user, 201, res);
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

    // Validate credentials
    if (!username || !password) {
      return next(
        new ErrorResponse("Please provide username/email and password", 400)
      );
    }

    // Check if user exists
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc   Log user out / clear cookie
// @route  GET /api/v1/auth/logout
// @access Private
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc   Get current logged in user
// @route  GET /api/v1/auth/me
// @access Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    return next(new ErrorResponse("Not authorized", 401));
  }

  // Ensure req.user is properly typed and includes an id property
  const user = await User.findById((req.user as { id: string }).id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

// @desc   Update user details
// @route  PUT /api/v1/auth/updatedetails
// @access Private
export const updateDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only allow updating specific fields
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      email: req.body.email,
      about: req.body.about,
      role: req.body.role,
      experience: req.body.experience,
      skills: req.body.skills,
    };

    // Remove undefined fields
    (Object.keys(fieldsToUpdate) as Array<keyof typeof fieldsToUpdate>).forEach(
          (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

    if (!req.user) {
      return next(new ErrorResponse("Not authorized", 401));
    }

    const user = await User.findByIdAndUpdate((req.user as { id: string }).id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update password
// @route  PUT /api/v1/auth/updatepassword
// @access Private
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    if (!req.user) {
      return next(new ErrorResponse("Not authorized", 401));
    }

    const user = await User.findById((req.user as { id: string }).id).select("+password");

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(new ErrorResponse("Password is incorrect", 401));
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc   Forgot password
// @route  POST /api/v1/auth/forgotpassword
// @access Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse("There is no user with that email", 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // Save user with the reset token and expiry
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });

      res.status(200).json({
        success: true,
        data: "Email sent",
      });
    } catch (err) {
      logger.error(`Email could not be sent: ${err}`);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc   Reset password
// @route  PUT /api/v1/auth/resetpassword/:resettoken
// @access Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid or expired token", 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc   Verify OTP for password reset
// @route  POST /api/v1/auth/verifyotp
// @access Public
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Find user with the given email
    const user = await User.findOne({
      email,
      resetPasswordToken: crypto.createHash("sha256").update(otp).digest("hex"),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid or expired OTP", 400));
    }

    res.status(200).json({
      success: true,
      data: {
        message: "OTP verified successfully",
        token: otp, // Return the original OTP as the token for the reset password step
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response
): void => {
  // Create token
  const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
  const token = jwt.sign({ id: user._id }, jwtSecret, {
    expiresIn: "30d",
  });

  // Remove password from response
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: user,
  });
};
function next(arg0: ErrorResponse): void | PromiseLike<void> {
    throw new Error("Function not implemented.");
}
