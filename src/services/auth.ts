// src/services/auth.service.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { IUser } from "../models/user";
import { UserService } from "./user";
import { ErrorResponse } from "../utils/error-response";
import env from "../config/env";

/**
 * Authentication service - handles business logic for authentication
 */
export class AuthService {
  /**
   * Register a new user
   * @param username Username
   * @param email Email
   * @param password Password
   * @returns Registered user and token
   */
  public static async register(
    username: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser =
      (await UserService.findUserByEmailOrUsername(email)) ||
      (await UserService.findUserByEmailOrUsername(username));

    if (existingUser) {
      throw new ErrorResponse("User already exists", 400);
    }

    // Create user
    const user = await UserService.createUser({
      username,
      email,
      password,
    });

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login user
   * @param identifier Username or email
   * @param password Password
   * @returns Logged in user and token
   */
  public static async login(
    identifier: string,
    password: string
  ): Promise<{ user: IUser; token: string }> {
    // Find user
    const user = await UserService.findUserByEmailOrUsername(identifier);

    if (!user) {
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Generate JWT token
   * @param user User document
   * @returns JWT token
   */
  public static generateToken(user: IUser): string {
    return jwt.sign({ id: user._id }, env.JWT_SECRET as jwt.Secret, {
      expiresIn: env.JWT_EXPIRE,
    });
  }

  /**
   * Send password reset email
   * @param email User email
   * @param resetUrl Reset URL
   * @returns True if email sent successfully
   */
  public static async forgotPassword(email: string): Promise<string> {
    // Generate token
    const resetToken = await UserService.generatePasswordResetToken(email);

    return resetToken;
  }

  /**
   * Reset user password
   * @param resetToken Raw reset token
   * @param newPassword New password
   * @returns Updated user and token
   */
  public static async resetPassword(
    resetToken: string,
    newPassword: string
  ): Promise<{ user: IUser; token: string }> {
    // Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Reset password
    const user = await UserService.resetUserPassword(hashedToken, newPassword);

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Verify OTP (one-time password)
   * @param email User email
   * @param otp OTP
   * @returns True if OTP is valid
   */
  public static async verifyOTP(email: string, otp: string): Promise<boolean> {
    // Hash OTP
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // Find user with OTP
    const user = await UserService.findUserByEmail(email);

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
      return false;
    }

    // Check if OTP matches and is not expired
    const isValid =
      user.resetPasswordToken === hashedOTP &&
      user.resetPasswordExpire.getTime() > Date.now();

    return isValid;
  }
}
