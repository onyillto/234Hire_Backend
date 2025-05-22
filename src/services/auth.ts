// src/services/auth.service.ts
import sign from "jwt-encode";
import crypto from "crypto";
import { IUser } from "../models/user";
import { UserService } from "./user";
import { ErrorResponse } from "../utils/error-response";
import env from "../config/env";

// Define interfaces for better type safety
interface JwtOptions {
  alg: "HS256";
  typ: "JWT";
  expiresIn?: string;
  [key: string]: any;
}

interface JwtPayload {
  id: string;
  iat: number;
  exp?: number;
  [key: string]: any;
}

interface TokenResponse {
  token: string;
  expiresAt: Date;
}

/**
 * Authentication service - handles business logic for authentication
 */
export class AuthService {
  // Constants for better maintainability
  private static readonly TOKEN_EXPIRY = env.JWT_EXPIRE || "30d";
  private static readonly HASH_ALGORITHM = "sha256";
  private static readonly ENCODING = "hex";

  /**
   * Register a new user
   * @param userData User registration data
   * @returns Registered user and token
   */
  public static async register({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    await this.checkUserExists(email, username);

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
    if (!identifier || !password) {
      throw new ErrorResponse(
        "Please provide email/username and password",
        400
      );
    }

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
   * Generate JWT token using jwt-encode
   * @param user User document
   * @returns JWT token
   */
  public static generateToken(user: IUser): string {
    if (!user._id) {
      throw new ErrorResponse("User ID is required for token generation", 500);
    }

    try {
      // Calculate expiry time based on env.JWT_EXPIRE
      const expirySeconds = this.getExpiryInSeconds(this.TOKEN_EXPIRY);
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + expirySeconds;

      // Create payload with expiration time
      const payload: JwtPayload = {
        id: user._id.toString(),
        iat: currentTime,
        exp: expiryTime,
        username: user.username,
        role: user.role || "user",
      };

      // Create options for jwt-encode
      const options: JwtOptions = {
        alg: "HS256",
        typ: "JWT",
      };

      // Sign the token
      return sign(payload, env.JWT_SECRET, options);
    } catch (error) {
      console.error("Token generation error:", error);
      throw new ErrorResponse(
        `Failed to generate token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  }

  /**
   * Generate authentication token with expiry
   * @param user User document
   * @returns Token and expiration date
   */
  public static generateAuthToken(user: IUser): TokenResponse {
    if (!user._id) {
      throw new ErrorResponse("User ID is required to generate token", 500);
    }

    try {
      // Calculate expiry time
      const expirySeconds = this.getExpiryInSeconds(this.TOKEN_EXPIRY);
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + expirySeconds;
      const expiresAt = new Date(expiryTime * 1000);

      // Create payload with expiration time
      const payload: JwtPayload = {
        id: user._id.toString(),
        iat: currentTime,
        exp: expiryTime,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      };

      // Create options for jwt-encode
      const options: JwtOptions = {
        alg: "HS256",
        typ: "JWT",
      };

      // Sign the token
      const token = sign(payload, env.JWT_SECRET, options);

      return { token, expiresAt };
    } catch (error) {
      console.error("Token generation error:", error);
      throw new ErrorResponse(
        "Failed to generate authentication token. Please try again later.",
        500
      );
    }
  }

  /**
   * Send password reset email
   * @param email User email
   * @returns Reset token
   */
  public static async forgotPassword(email: string): Promise<string> {
    if (!email) {
      throw new ErrorResponse("Email is required", 400);
    }

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
    if (!resetToken || !newPassword) {
      throw new ErrorResponse("Reset token and new password are required", 400);
    }

    // Hash token
    const hashedToken = this.hashString(resetToken);

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
    if (!email || !otp) {
      return false;
    }

    // Hash OTP
    const hashedOTP = this.hashString(otp);

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

  // -------------------- Private Utility Methods --------------------

  /**
   * Hash a string using SHA-256
   * @param str String to hash
   * @returns Hashed string
   */
  private static hashString(str: string): string {
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(str)
      .digest(this.ENCODING);
  }

  /**
   * Check if a user exists with the given email or username
   * @param email Email
   * @param username Username
   * @throws ErrorResponse if user exists
   */
  private static async checkUserExists(
    email: string,
    username: string
  ): Promise<void> {
    const existingUser =
      (await UserService.findUserByEmailOrUsername(email)) ||
      (await UserService.findUserByEmailOrUsername(username));

    if (existingUser) {
      throw new ErrorResponse("User already exists", 400);
    }
  }

  /**
   * Convert expiry string to seconds
   * @param expiry Expiry string (e.g. '30d', '1h', '30m')
   * @returns Expiry in seconds
   */
  private static getExpiryInSeconds(expiry: string): number {
    // Default to 30 days if not specified
    if (!expiry) return 30 * 24 * 60 * 60;

    // Parse the expiry string
    const unit = expiry.charAt(expiry.length - 1);
    const value = parseInt(expiry.substring(0, expiry.length - 1), 10);

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        // If no unit is specified, assume seconds
        return parseInt(expiry, 10);
    }
  }
}
