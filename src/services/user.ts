// src/services/user.service.ts
import { User, IUser } from "../models/user";
import { ErrorResponse } from "../utils/error-response";

/**
 * User service - handles business logic for user operations
 */
export class UserService {
  /**
   * Get user by ID
   * @param id User ID
   * @returns User document
   */
  public static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    return user;
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User document or null
   */
  public static async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   * @param username Username
   * @returns User document or null
   */
  public static async findUserByUsername(
    username: string
  ): Promise<IUser | null> {
    return await User.findOne({ username: username.toLowerCase() });
  }

  /**
   * Find user by email or username
   * @param identifier Email or username
   * @returns User document or null
   */
  public static async findUserByEmailOrUsername(
    identifier: string
  ): Promise<IUser | null> {
    return await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    });
  }

  /**
   * Create a new user
   * @param userData User data
   * @returns Created user
   */
  public static async createUser(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }

  /**
   * Update user profile
   * @param userId User ID
   * @param updateData Update data
   * @returns Updated user
   */
  public static async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    // Remove sensitive fields if they exist
    const { password, ...safeUpdateData } = updateData as any;

    return await User.findByIdAndUpdate(userId, safeUpdateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Update user password
   * @param user User document
   * @param newPassword New password
   * @returns Updated user
   */
  public static async updatePassword(
    user: IUser,
    newPassword: string
  ): Promise<IUser> {
    user.password = newPassword;
    await user.save();
    return user;
  }

  /**
   * Generate password reset token
   * @param email User email
   * @returns Reset token
   */
  public static async generatePasswordResetToken(
    email: string
  ): Promise<string> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    // Generate and hash token
    const resetToken = user.getResetPasswordToken();

    // Save token to user
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  /**
   * Reset password
   * @param token Reset token
   * @param newPassword New password
   * @returns Updated user
   */
  public static async resetUserPassword(
    hashedToken: string,
    newPassword: string
  ): Promise<IUser> {
    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ErrorResponse("Invalid or expired token", 400);
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return user;
  }
}
