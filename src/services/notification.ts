// src/services/notification.service.ts
import { Notification } from "../models/notification";
import { User } from "../models/user";

export class NotificationService {
  /**
   * Notify specialists about new job matching their skills
   */
  public static async notifyJobPosted(
    jobId: string,
    jobTitle: string,
    jobSkills: string[]
  ) {
    // Find ALL specialists (removed skills matching temporarily)
    const matchingUsers = await User.find({
      role: "specialist",
    }).limit(50); // Limit to prevent spam

    const notifications = matchingUsers.map((user) => ({
      recipient: user._id,
      type: "job_posted",
      title: "New Job Match!",
      message: `A new job "${jobTitle}" matches your skills. Check it out!`,
      relatedJob: jobId,
      actionUrl: `/jobs/${jobId}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications.length;
  }
  /**
   * Notify applicant when application is accepted
   */
  public static async notifyApplicationAccepted(
    recipientId: string,
    senderId: string,
    jobId: string,
    applicationId: string,
    jobTitle: string
  ) {
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
  }

  /**
   * Notify applicant when application is rejected
   */
  public static async notifyApplicationRejected(
    recipientId: string,
    senderId: string,
    jobId: string,
    applicationId: string,
    jobTitle: string
  ) {
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
  }

  /**
   * Notify about job completion
   */
  public static async notifyJobCompleted(
    recipientId: string,
    jobId: string,
    jobTitle: string,
    isEmployer: boolean = false
  ) {
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
  }

  /**
   * Get user notifications
   */
  public static async getUserNotifications(
    userId: string,
    options: { isRead?: boolean; page?: number; limit?: number } = {}
  ) {
    const { isRead, page = 1, limit = 20 } = options;

    const query: any = { recipient: userId };
    if (isRead !== undefined) query.isRead = isRead;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("sender", "fullName profilePhoto employerProfile.companyName")
        .populate("relatedJob", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  public static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Notify employer about new job application
   */
  public static async notifyNewApplication(
    employerId: string,
    applicantId: string,
    jobId: string,
    applicationId: string,
    jobTitle: string,
    applicantName: string
  ) {
    const notification = new Notification({
      recipient: employerId,
      sender: applicantId,
      type: "job_posted", // ✅ Use existing enum value temporarily
      title: "New Application Received",
      message: `${applicantName} has applied for your job "${jobTitle}".`,
      relatedJob: jobId,
      relatedApplication: applicationId,
      actionUrl: `/applications/${applicationId}`,
    });

    return await notification.save();
  }

  /**
   * Notify applicant when application is being reviewed
   */
  public static async notifyApplicationReviewed(
    recipientId: string,
    senderId: string,
    jobId: string,
    applicationId: string,
    jobTitle: string,
    employerName: string
  ) {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type: "application_accepted", // Using existing enum, you can add "application_reviewed" to enum
      title: "Application Under Review",
      message: `${employerName} is reviewing your application for "${jobTitle}".`,
      relatedJob: jobId,
      relatedApplication: applicationId,
      actionUrl: `/applications/${applicationId}`,
    });

    return await notification.save();
  }

  /**
   * Generic notification for status changes
   */
  public static async notifyApplicationStatusChanged(
    recipientId: string,
    senderId: string,
    jobId: string,
    applicationId: string,
    jobTitle: string,
    newStatus: string,
    customMessage?: string
  ) {
    const defaultMessage = `Your application status for "${jobTitle}" has been updated to ${newStatus}.`;

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type: "job_posted", // Using existing enum
      title: "Application Status Update",
      message: customMessage || defaultMessage,
      relatedJob: jobId,
      relatedApplication: applicationId,
      actionUrl: `/applications/${applicationId}`,
    });

    return await notification.save();
  }
}
