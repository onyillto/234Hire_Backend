// src/controllers/auth.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";
import { AuthService } from "../services/auth";

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

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    // Handle duplicate key error (user already exists)
    if ((error as any).code === 11000) {
      const field = Object.keys((error as any).keyValue)[0];
      const message = `${field} already exists`;
      return next(new ErrorResponse(message, 400));
    }

    next(error);
  }
};
