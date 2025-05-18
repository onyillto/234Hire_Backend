// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { UserService } from "../services/user";
import { ErrorResponse } from "../utils/error-response";

// @desc   Get all users
// @route  GET /api/v1/users
// @access Private/Admin
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments();

    // Get users
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination: any = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single user
// @route  GET /api/v1/users/:id
// @access Private/Admin
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create user
// @route  POST /api/v1/users
// @access Private/Admin
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser =
      (await UserService.findUserByEmailOrUsername(email)) ||
      (await UserService.findUserByEmailOrUsername(username));

    if (existingUser) {
      return next(new ErrorResponse("User already exists", 400));
    }

    // Create user
    const user = await UserService.createUser({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update user
// @route  PUT /api/v1/users/:id
// @access Private/Admin
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Remove password from request body
    const { password, ...updateData } = req.body;

    const user = await UserService.updateProfile(req.params.id, updateData);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete user
// @route  DELETE /api/v1/users/:id
// @access Private/Admin
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id) as (InstanceType<typeof User> & { _id: string });

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Don't allow deleting own account
    if ((user._id as string).toString() === (req.user as { id: string })?.id) {
      return next(new ErrorResponse("Cannot delete own account", 400));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
