// src/models/notification.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User who receives the notification
  sender?: mongoose.Types.ObjectId; // User who triggered the notification

  type:
    | "job_posted"
    | "application_accepted"
    | "application_rejected"
    | "job_completed";
  title: string;
  message: string;

  isRead: boolean;

  // Related entities
  relatedJob?: mongoose.Types.ObjectId;
  relatedApplication?: mongoose.Types.ObjectId;

  actionUrl?: string; // URL to redirect when notification is clicked

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "job_posted",
        "application_accepted",
        "application_rejected",
        "job_completed",
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message must not exceed 500 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedApplication: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    actionUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

// Helper functions for creating notifications
export const createJobPostedNotification = async (
  recipientId: string,
  jobId: string,
  jobTitle: string
) => {
  const notification = new Notification({
    recipient: recipientId,
    type: "job_posted",
    title: "New Job Match!",
    message: `A new job "${jobTitle}" matches your skills. Check it out!`,
    relatedJob: jobId,
    actionUrl: `/jobs/${jobId}`,
  });

  return await notification.save();
};

export const createApplicationAcceptedNotification = async (
  recipientId: string,
  senderId: string,
  jobId: string,
  applicationId: string,
  jobTitle: string
) => {
  const notification = new Notification({
    recipient: recipientId,
    sender: senderId,
    type: "application_accepted",
    title: "Application Accepted! 🎉",
    message: `Congratulations! Your application for "${jobTitle}" has been accepted.`,
    relatedJob: jobId,
    relatedApplication: applicationId,
    actionUrl: `/applications/${applicationId}`,
  });

  return await notification.save();
};

export const createApplicationRejectedNotification = async (
  recipientId: string,
  senderId: string,
  jobId: string,
  applicationId: string,
  jobTitle: string
) => {
  const notification = new Notification({
    recipient: recipientId,
    sender: senderId,
    type: "application_rejected",
    title: "Application Update",
    message: `Thank you for your interest in "${jobTitle}". We've decided to move forward with other candidates.`,
    relatedJob: jobId,
    relatedApplication: applicationId,
    actionUrl: `/jobs`,
  });

  return await notification.save();
};

export const createJobCompletedNotification = async (
  recipientId: string,
  jobId: string,
  jobTitle: string,
  isEmployer: boolean = false
) => {
  const notification = new Notification({
    recipient: recipientId,
    type: "job_completed",
    title: isEmployer ? "Job Completed" : "Job Completed! 🎉",
    message: isEmployer
      ? `The job "${jobTitle}" has been marked as completed.`
      : `Congratulations on completing the job "${jobTitle}"!`,
    relatedJob: jobId,
    actionUrl: `/jobs/${jobId}`,
  });

  return await notification.save();
};

// Query helper functions
export const getUserNotifications = (
  userId: string,
  options: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  } = {}
) => {
  const { isRead, page = 1, limit = 20 } = options;

  const query: any = { recipient: userId };
  if (isRead !== undefined) query.isRead = isRead;

  const skip = (page - 1) * limit;

  return Notification.find(query)
    .populate("sender", "fullName profilePhoto employerProfile.companyName")
    .populate("relatedJob", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const getUnreadCount = (userId: string) => {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

export const markAsRead = (notificationId: string, userId: string) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
};

export const markAllAsRead = (userId: string) => {
  return Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};
