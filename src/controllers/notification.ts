// src/controllers/notification.ts
import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification";
import { ErrorResponse } from "../utils/error-response";

// @desc   Get user notifications
// @route  GET /api/v1/notifications
// @access Private
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    const { isRead, page, limit } = req.query;

    const result = await NotificationService.getUserNotifications(userId, {
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark notification as read
// @route  PUT /api/v1/notifications/:id/read
// @access Private
export const markNotificationRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;


    
    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    if (typeof id !== 'string') {
      return next(new ErrorResponse("Invalid notification ID", 400));
    }
    const notification = await NotificationService.markAsRead(id, userId);

    if (!notification) {
      return next(new ErrorResponse("Notification not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark all notifications as read
// @route  PUT /api/v1/notifications/read-all
// @access Private
export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    const result = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    next(error);
  }
};
