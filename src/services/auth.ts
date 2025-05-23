import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../models/user";
import { ErrorResponse } from "../utils/error-response";
import env from "../config/env";

// Define JWT payload structure
interface JwtPayload {
  id: string;
  username: string;
  role: string;
}

export class AuthService {
  private static readonly TOKEN_EXPIRY = env.JWT_EXPIRE || "30d";

  /**
   * Generate JWT token
   * @param user User document
   * @returns JWT token as string
   */
  public static generateToken(user: IUser): string {
    if (!user._id) {
      throw new ErrorResponse("User ID is required for token generation", 500);
    }

    const payload: JwtPayload = {
      id: user._id.toString(),
      username: user.username,
      role: user.role || "user",
    };

    if (!env.JWT_SECRET || env.JWT_SECRET === "your_jwt_secret") {
      throw new ErrorResponse(
        "JWT_SECRET is not properly configured in environment variables",
        500
      );
    }

    // Define token options separately and ensure correct types
    const options: SignOptions = {
      expiresIn: AuthService.getExpiryInSeconds(AuthService.TOKEN_EXPIRY),
    };

    try {
      return jwt.sign(payload, env.JWT_SECRET, options);
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
   * Convert expiry string to seconds (not used, but can be useful)
   */
  private static getExpiryInSeconds(expiry: string): number {
    if (!expiry) return 30 * 24 * 60 * 60;

    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

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
        return parseInt(expiry, 10);
    }
  }
}
