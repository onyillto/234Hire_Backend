// src/controllers/userOverview.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Application, IApplication } from "../models/application";
import { Job, IJob } from "../models/job";
import { User, IUser } from "../models/user";
import { Transaction } from "../models/transaction.model";
import { Notification } from "../models/notification";
import { ErrorResponse } from "../utils/error-response";

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    role?: string;
    [key: string]: any;
  };
}

interface UserStats {
  [key: string]: any;
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  relatedId: mongoose.Types.ObjectId;
  status: string;
}

// @desc   Get comprehensive user overview (applications, jobs, stats)
// @route  GET /api/v1/user/overview
// @access Private
export const getUserOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorResponse("Invalid user ID", 400));
    }

    // Get user details with error handling
    const user = await User.findById(userId)
      .select(
        "-password -emailVerificationOTP -emailVerificationOTPExpire -forgotPasswordOTP -forgotPasswordOTPExpire"
      )
      .populate({
        path: "ratings.ratedBy",
        select: "fullName employerProfile.companyName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "ratings.job",
        select: "title",
        options: { strictPopulate: false },
      })
      .lean();

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Initialize response data
    let applications: any[] = [];
    let jobs: any[] = [];
    let transactions: any[] = [];
    let notifications: any[] = [];
    let stats: UserStats = {};

    try {
      // Role-based data fetching with comprehensive stats
      switch (user.role) {
        case "specialist":
        case "user":
          await handleSpecialistData(userId, user, applications, stats);
          break;
        case "partner":
        case "employer":
          await handleEmployerData(userId, user, applications, jobs, stats);
          break;
        case "admin":
          await handleAdminData(userId, applications, jobs, stats);
          break;
        default:
          await handleBasicUserData(userId, user, stats);
      }

      // GET TRANSACTIONS (for all roles)
      transactions = await getTransactions(userId);

      // Calculate financial stats from transactions
      const { totalEarnings, totalSpent } = calculateFinancialStats(
        transactions,
        userId
      );

      // Update stats with financial data based on role
      if (["specialist", "user"].includes(user.role || "")) {
        stats.totalEarnings = totalEarnings;
        stats.pendingEarnings = await calculatePendingEarnings(userId);
        stats.availableBalance = await calculateAvailableBalance(userId);
      } else if (["partner", "employer"].includes(user.role || "")) {
        stats.totalSpent = totalSpent;
        stats.pendingPayments = await calculatePendingPayments(userId);
        stats.monthlySpend = await calculateMonthlySpend(userId);
      } else if (user.role === "admin") {
        stats.platformRevenue = await calculatePlatformRevenue();
        stats.totalEarnings = totalEarnings;
        stats.totalSpent = totalSpent;
      }

      // GET RECENT NOTIFICATIONS
      const notificationData = await getNotifications(userId);
      notifications = notificationData.notifications;
      const unreadNotificationsCount = notificationData.unreadCount;

      if (!user.role) {
        return next(
          new ErrorResponse(
            "User role is missing. Cannot generate activity.",
            500
          )
        );
      }

      // RECENT ACTIVITY TIMELINE
      const recentActivity = generateRecentActivity(
        user.role,
        applications.slice(0, 5),
        jobs.slice(0, 3),
        transactions.slice(0, 3),
        userId
      );

      // RESPONSE
      res.status(200).json({
        success: true,
        message: "User overview retrieved successfully",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            profilePhoto: user.profilePhoto,
            location: user.location,
            bio: user.bio,
            averageRating: user.averageRating || 0,
            isEmailVerified: user.isEmailVerified,
            employerProfile: user.employerProfile,
            specialistProfile: user.specialistProfile,
            createdAt: user.createdAt,
          },
          stats,
          applications: {
            total: applications.length,
            data: applications.slice(0, 10),
            hasMore: applications.length > 10,
          },
          jobs: {
            total: jobs.length,
            data: jobs.slice(0, 10),
            hasMore: jobs.length > 10,
          },
          transactions: {
            total: transactions.length,
            data: transactions.slice(0, 5),
            hasMore: transactions.length > 5,
          },
          notifications: {
            total: notifications.length,
            unreadCount: unreadNotificationsCount,
            data: notifications.slice(0, 5),
            hasMore: notifications.length > 5,
          },
          recentActivity: recentActivity.slice(0, 10),
          summary: {
            profileCompletion: calculateProfileCompletion(user),
            accountStatus: user.isEmailVerified
              ? "verified"
              : "pending_verification",
            memberSince: user.createdAt,
            lastActive: new Date().toISOString(),
          },
        },
      });
    } catch (dataError) {
      console.error("Error fetching user overview data:", dataError);
      return next(new ErrorResponse("Failed to retrieve user data", 500));
    }
  } catch (error) {
    console.error("User overview error:", error);
    next(error);
  }
};

// Helper function to handle specialist/user data


async function handleSpecialistData(
  userId: string,
  user: any,
  applications: any[],
  stats: UserStats
): Promise<void> {
  try {
    // Get all applications by this specialist
    const userApplications = await Application.find({ applicant: userId })
      .populate({
        path: "job",
        select:
          "title location jobType workType salaryMin salaryMax currency status postedBy applicationDeadline overallCompletionPercentage",
        populate: {
          path: "postedBy",
          select: "fullName employerProfile.companyName profilePhoto",
          options: { strictPopulate: false },
        },
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    applications.push(...userApplications.filter((app) => app.job));

    // Get comprehensive specialist stats
    const applicationStats = await Application.aggregate([
      {
        $match: {
          applicant: new mongoose.Types.ObjectId(userId),
          job: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgTimeToDecision: {
            $avg: {
              $cond: {
                if: { $in: ["$status", ["accepted", "rejected"]] },
                then: "$analytics.timeToDecision",
                else: null,
              },
            },
          },
        },
      },
    ]);

    const statsMap: { [key: string]: number } = {};
    applicationStats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    const totalValidApplications = applications.length;
    const acceptedCount = statsMap.accepted || 0;
    const rejectedCount = statsMap.rejected || 0;
    const pendingCount = statsMap.pending || 0;

    // Calculate performance metrics
    const successRate =
      totalValidApplications > 0
        ? Math.round((acceptedCount / totalValidApplications) * 100)
        : 0;

    const responseRate =
      totalValidApplications > 0
        ? Math.round(
            ((acceptedCount + rejectedCount) / totalValidApplications) * 100
          )
        : 0;

    // FIX: Get ACTUAL completed projects by checking jobs with "completed" status
    // where the user has an "accepted" application
    const completedProjectsData = await Application.aggregate([
      {
        $match: {
          applicant: new mongoose.Types.ObjectId(userId),
          status: "accepted",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "jobDetails",
        },
      },
      {
        $unwind: "$jobDetails",
      },
      {
        $match: {
          "jobDetails.status": "completed",
          "jobDetails.overallCompletionPercentage": 100,
        },
      },
      {
        $count: "completedProjects",
      },
    ]);

    const completedProjects =
      completedProjectsData.length > 0
        ? completedProjectsData[0].completedProjects
        : 0;

    // FIX: Active projects should be accepted applications where job is NOT completed
    const activeProjectsData = await Application.aggregate([
      {
        $match: {
          applicant: new mongoose.Types.ObjectId(userId),
          status: "accepted",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "jobDetails",
        },
      },
      {
        $unwind: "$jobDetails",
      },
      {
        $match: {
          "jobDetails.status": { $in: ["active", "reviewing"] },
        },
      },
      {
        $count: "activeProjects",
      },
    ]);

    const activeProjects =
      activeProjectsData.length > 0 ? activeProjectsData[0].activeProjects : 0;

    // Get recent job categories applied to
    const recentCategories = await Application.aggregate([
      { $match: { applicant: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "jobInfo",
        },
      },
      { $unwind: "$jobInfo" },
      { $group: { _id: "$jobInfo.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    stats = Object.assign(stats, {
      // Application Stats
      totalApplications: totalValidApplications,
      pendingApplications: pendingCount,
      reviewedApplications: statsMap.reviewed || 0,
      acceptedApplications: acceptedCount,
      rejectedApplications: rejectedCount,
      withdrawnApplications: statsMap.withdrawn || 0,

      // Performance Metrics
      successRate,
      responseRate,
      averageRating: user.averageRating || 0,
      totalRatings: user.ratings?.length || 0,

      // FIXED: Project Stats
      activeProjects: activeProjects, // Only accepted apps with active jobs
      completedProjects: completedProjects, // Only accepted apps with completed jobs

      // Categories
      topCategories: recentCategories.map((cat) => ({
        category: cat._id,
        applications: cat.count,
      })),

      // Time-based metrics
      applicationStreak: await calculateApplicationStreak(userId),
      averageApplicationsPerMonth: await calculateMonthlyApplicationAverage(
        userId
      ),

      // Earnings placeholder (will be updated with transaction data)
      totalEarnings: 0,
      pendingEarnings: 0,
      availableBalance: 0,
    });
  } catch (error) {
    console.error("Error handling specialist data:", error);
    // Set default stats on error
    stats = Object.assign(stats, getDefaultSpecialistStats(user));
  }
}
// Helper function to handle employer/partner data
async function handleEmployerData(
  userId: string,
  user: any,
  applications: any[],
  jobs: any[],
  stats: UserStats
): Promise<void> {
  try {
    // Get all jobs posted by this employer
    const userJobs = await Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (userJobs.length === 0) {
      stats = Object.assign(stats, getDefaultEmployerStats());
      return;
    }

    jobs.push(...userJobs);

    // Get applications for employer's jobs
    const jobIds = userJobs.map((job) => job._id);
    const jobApplications = await Application.find({
      job: { $in: jobIds },
    })
      .populate({
        path: "applicant",
        select:
          "fullName email username profilePhoto ratings averageRating location bio workExperience skills",
        options: { strictPopulate: false },
      })
      .populate({
        path: "job",
        select:
          "title location jobType workType salaryMin salaryMax currency status",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    applications.push(
      ...jobApplications.filter((app) => app.job && app.applicant)
    );

    // Enhanced job analytics
    const jobApplicationsMap = new Map();
    jobApplications.forEach((app) => {
      if (!app.job || !app._id) return;

      const jobId = app.job._id.toString();
      if (!jobApplicationsMap.has(jobId)) {
        jobApplicationsMap.set(jobId, {
          total: 0,
          pending: 0,
          reviewed: 0,
          accepted: 0,
          rejected: 0,
          recentApplications: [],
        });
      }

      const jobApps = jobApplicationsMap.get(jobId);
      jobApps.total++;

      if (app.status && typeof jobApps[app.status] === "number") {
        jobApps[app.status]++;
      }

      if (jobApps.recentApplications.length < 3) {
        jobApps.recentApplications.push({
          id: app._id,
          applicant: app.applicant,
          status: app.status,
          appliedAt: app.createdAt,
          coverLetter: app.coverLetter,
        });
      }
    });

    // Enhance jobs with application data
    const enhancedJobs = userJobs.map((job) => {
      const jobApps = jobApplicationsMap.get(job._id.toString()) || {
        total: 0,
        pending: 0,
        reviewed: 0,
        accepted: 0,
        rejected: 0,
        recentApplications: [],
      };

      return {
        ...job,
        applicationsCount: jobApps.total,
        applicationBreakdown: {
          pending: jobApps.pending,
          reviewed: jobApps.reviewed,
          accepted: jobApps.accepted,
          rejected: jobApps.rejected,
        },
        recentApplications: jobApps.recentApplications,
        hasNewApplications: jobApps.pending > 0,
        isActive: job.status === "active",
      };
    });

    jobs.length = 0;
    jobs.push(...enhancedJobs);

    // Comprehensive employer statistics
    const jobStats = await Job.aggregate([
      { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgSalary: { $avg: { $add: ["$salaryMin", "$salaryMax"] } },
        },
      },
    ]);

    const jobStatsMap: { [key: string]: number } = {};
    jobStats.forEach((stat) => {
      jobStatsMap[stat._id] = stat.count;
    });

    const totalApplicationsReceived = jobApplications.length;
    const totalHires = jobApplications.filter(
      (app) => app.status === "accepted"
    ).length;
    const totalRejections = jobApplications.filter(
      (app) => app.status === "rejected"
    ).length;

    // Calculate hiring metrics
    const hireRate =
      totalApplicationsReceived > 0
        ? Math.round((totalHires / totalApplicationsReceived) * 100)
        : 0;

    const responseRate =
      totalApplicationsReceived > 0
        ? Math.round(
            ((totalHires + totalRejections) / totalApplicationsReceived) * 100
          )
        : 0;

    // Get top job categories
    const topCategories = await Job.aggregate([
      { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Average time to fill positions
    const avgTimeToHire = await Application.aggregate([
      {
        $match: {
          job: { $in: jobIds },
          status: "accepted",
          "analytics.timeToDecision": { $exists: true },
        },
      },
      { $group: { _id: null, avgTime: { $avg: "$analytics.timeToDecision" } } },
    ]);

    stats = Object.assign(stats, {
      // Job Posting Stats
      totalJobsPosted: userJobs.length,
      activeJobs: jobStatsMap.active || 0,
      completedJobs: jobStatsMap.completed || 0,
      pausedJobs: jobStatsMap.paused || 0,
      draftJobs: jobStatsMap.draft || 0,
      cancelledJobs: jobStatsMap.cancelled || 0,

      // Application & Hiring Stats
      totalApplicationsReceived,
      totalHires,
      totalRejections,
      pendingApplications: jobApplications.filter(
        (app) => app.status === "pending"
      ).length,

      // Performance Metrics
      hireRate,
      responseRate,
      averageApplicationsPerJob:
        userJobs.length > 0
          ? Math.round(totalApplicationsReceived / userJobs.length)
          : 0,
      averageTimeToHire:
        avgTimeToHire.length > 0
          ? Math.round(avgTimeToHire[0].avgTime || 0)
          : 0,

      // Categories and Preferences
      topJobCategories: topCategories.map((cat) => ({
        category: cat._id,
        count: cat.count,
      })),

      // Time-based metrics
      jobPostingStreak: await calculateJobPostingStreak(userId),
      averageJobsPerMonth: await calculateMonthlyJobAverage(userId),

      // Financial placeholders (will be updated with transaction data)
      totalSpent: 0,
      pendingPayments: 0,
      monthlySpend: 0,
    });
  } catch (error) {
    console.error("Error handling employer data:", error);
    stats = Object.assign(stats, getDefaultEmployerStats());
  }
}

// Helper function to handle admin data
async function handleAdminData(
  userId: string,
  applications: any[],
  jobs: any[],
  stats: UserStats
): Promise<void> {
  try {
    // Get platform-wide statistics
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalTransactions,
      activeUsers,
      activeJobs,
      recentUsers,
      recentJobs,
      recentApplications,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments({
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Job.countDocuments({ status: "active" }),
      User.find().sort({ createdAt: -1 }).limit(10).lean(),
      Job.find().sort({ createdAt: -1 }).limit(10).lean(),
      Application.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Get user role distribution
    const userRoleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get job category distribution
    const jobCategoryStats = await Job.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get application status distribution
    const applicationStatusStats = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent activity for admin
    applications.push(...recentApplications);
    jobs.push(...recentJobs);

    stats = Object.assign(stats, {
      // Platform Overview
      totalUsers,
      totalJobs,
      totalApplications,
      totalTransactions,
      activeUsers,
      activeJobs,

      // User Analytics
      userRoleDistribution: userRoleStats,
      newUsersThisMonth: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // Job Analytics
      jobCategoryDistribution: jobCategoryStats,
      newJobsThisMonth: await Job.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // Application Analytics
      applicationStatusDistribution: applicationStatusStats,
      newApplicationsThisMonth: await Application.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // Financial Overview
      platformRevenue: 0, // Will be calculated separately
      totalVolume: 0, // Will be calculated separately

      // Growth Metrics
      userGrowthRate: await calculateUserGrowthRate(),
      jobGrowthRate: await calculateJobGrowthRate(),

      // Recent Activity
      recentUsers: recentUsers.slice(0, 5),
      recentJobs: recentJobs.slice(0, 5),
      recentApplications: recentApplications.slice(0, 5),
    });
  } catch (error) {
    console.error("Error handling admin data:", error);
    stats = Object.assign(stats, getDefaultAdminStats());
  }
}

// Helper function to handle basic user data (for users without specific roles)
async function handleBasicUserData(
  userId: string,
  user: any,
  stats: UserStats
): Promise<void> {
  try {
    // Basic user stats
    const basicApplications = await Application.countDocuments({
      applicant: userId,
    });
    const basicJobs = await Job.countDocuments({ postedBy: userId });

    stats = Object.assign(stats, {
      totalApplications: basicApplications,
      totalJobsPosted: basicJobs,
      profileCompletion: calculateProfileCompletion(user),
      memberSince: user.createdAt,
      averageRating: user.averageRating || 0,
      totalRatings: user.ratings?.length || 0,
    });
  } catch (error) {
    console.error("Error handling basic user data:", error);
    stats = Object.assign(stats, {
      totalApplications: 0,
      totalJobsPosted: 0,
      profileCompletion: 0,
      averageRating: 0,
      totalRatings: 0,
    });
  }
}

// Default stats functions
function getDefaultSpecialistStats(user: any): UserStats {
  return {
    totalApplications: 0,
    pendingApplications: 0,
    reviewedApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    withdrawnApplications: 0,
    successRate: 0,
    responseRate: 0,
    averageRating: user.averageRating || 0,
    totalRatings: 0,
    activeProjects: 0,
    completedProjects: 0,
    topCategories: [],
    applicationStreak: 0,
    averageApplicationsPerMonth: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
  };
}

function getDefaultEmployerStats(): UserStats {
  return {
    totalJobsPosted: 0,
    activeJobs: 0,
    completedJobs: 0,
    pausedJobs: 0,
    draftJobs: 0,
    cancelledJobs: 0,
    totalApplicationsReceived: 0,
    totalHires: 0,
    totalRejections: 0,
    pendingApplications: 0,
    hireRate: 0,
    responseRate: 0,
    averageApplicationsPerJob: 0,
    averageTimeToHire: 0,
    topJobCategories: [],
    jobPostingStreak: 0,
    averageJobsPerMonth: 0,
    totalSpent: 0,
    pendingPayments: 0,
    monthlySpend: 0,
  };
}

function getDefaultAdminStats(): UserStats {
  return {
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalTransactions: 0,
    activeUsers: 0,
    activeJobs: 0,
    userRoleDistribution: [],
    newUsersThisMonth: 0,
    jobCategoryDistribution: [],
    newJobsThisMonth: 0,
    applicationStatusDistribution: [],
    newApplicationsThisMonth: 0,
    platformRevenue: 0,
    totalVolume: 0,
    userGrowthRate: 0,
    jobGrowthRate: 0,
    recentUsers: [],
    recentJobs: [],
    recentApplications: [],
  };
}

// Financial calculation functions
async function calculatePendingEarnings(userId: string): Promise<number> {
  const pendingTransactions = await Transaction.find({
    payee: userId,
    status: "pending",
  });
  return pendingTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);
}

async function calculateAvailableBalance(userId: string): Promise<number> {
  const user = await User.findById(userId);
  return user?.specialistProfile?.financialStats?.availableBalance || 0;
}

async function calculatePendingPayments(userId: string): Promise<number> {
  const pendingTransactions = await Transaction.find({
    payer: userId,
    status: "pending",
  });
  return pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
}

async function calculateMonthlySpend(userId: string): Promise<number> {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const monthlyTransactions = await Transaction.find({
    payer: userId,
    status: "completed",
    createdAt: { $gte: lastMonth },
  });
  return monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
}

async function calculatePlatformRevenue(): Promise<number> {
  const completedTransactions = await Transaction.find({ status: "completed" });
  return completedTransactions.reduce(
    (sum, t) => sum + (t.platformFee || 0),
    0
  );
}

// Streak and average calculation functions
async function calculateApplicationStreak(userId: string): Promise<number> {
  // Implementation for calculating application streak
  // This would track consecutive days/weeks of applications
  return 0; // Placeholder
}

async function calculateMonthlyApplicationAverage(
  userId: string
): Promise<number> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentApplications = await Application.countDocuments({
    applicant: userId,
    createdAt: { $gte: threeMonthsAgo },
  });

  return Math.round(recentApplications / 3);
}

async function calculateJobPostingStreak(userId: string): Promise<number> {
  // Implementation for calculating job posting streak
  return 0; // Placeholder
}

async function calculateMonthlyJobAverage(userId: string): Promise<number> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentJobs = await Job.countDocuments({
    postedBy: userId,
    createdAt: { $gte: threeMonthsAgo },
  });

  return Math.round(recentJobs / 3);
}

async function calculateUserGrowthRate(): Promise<number> {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 2);

  const [currentMonthUsers, previousMonthUsers] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: lastMonth } }),
    User.countDocuments({
      createdAt: {
        $gte: previousMonth,
        $lt: lastMonth,
      },
    }),
  ]);

  if (previousMonthUsers === 0) return 0;
  return Math.round(
    ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
  );
}

async function calculateJobGrowthRate(): Promise<number> {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 2);

  const [currentMonthJobs, previousMonthJobs] = await Promise.all([
    Job.countDocuments({ createdAt: { $gte: lastMonth } }),
    Job.countDocuments({
      createdAt: {
        $gte: previousMonth,
        $lt: lastMonth,
      },
    }),
  ]);

  if (previousMonthJobs === 0) return 0;
  return Math.round(
    ((currentMonthJobs - previousMonthJobs) / previousMonthJobs) * 100
  );
}

// Keep existing helper functions
async function getTransactions(userId: string): Promise<any[]> {
  try {
    const transactions = await Transaction.find({
      $or: [{ payer: userId }, { payee: userId }],
    })
      .populate({
        path: "payer",
        select: "fullName employerProfile.companyName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "payee",
        select: "fullName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "job",
        select: "title status overallCompletionPercentage",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Filter transactions to only include valid ones
    const validTransactions = [];

    for (const transaction of transactions) {
      // Skip transactions with missing references
      if (!transaction.payer || !transaction.payee || !transaction.job) {
        continue;
      }

      // For completed transactions, verify the job is actually completed
      if (transaction.status === "completed") {
        // Cast the populated `job` field to the IJob interface to inform
        // TypeScript about the populated properties.
        const job = transaction.job as unknown as IJob;

        // Only include if job is completed and 100% done
        if (
          job.status === "completed" &&
          job.overallCompletionPercentage === 100
        ) {
          // Also verify there's an accepted application
          const acceptedApp = await Application.findOne({
            job: job._id, // Use the _id from the populated job
            // The payee of the transaction is the applicant who got accepted.
            applicant: (transaction.payee as unknown as IUser)._id,
            status: "accepted",
          }).lean();

          if (acceptedApp) {
            validTransactions.push(transaction);
          }
        }
      } else {
        // For pending transactions, include them but flag for validation
        validTransactions.push(transaction);
      }
    }

    return validTransactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Add this new function to calculate only valid financial stats:



function calculateFinancialStats(
  transactions: any[],
  userId: string
): { totalEarnings: number; totalSpent: number } {
  let totalEarnings = 0;
  let totalSpent = 0;

  transactions.forEach((transaction) => {
    if (transaction.status === "completed") {
      if (transaction.payee && transaction.payee._id.toString() === userId) {
        totalEarnings += transaction.netAmount || 0;
      }
      if (transaction.payer && transaction.payer._id.toString() === userId) {
        totalSpent += transaction.amount || 0;
      }
    }
  });

  return { totalEarnings, totalSpent };
}

// Helper function to get notifications
async function getNotifications(
  userId: string
): Promise<{ notifications: any[]; unreadCount: number }> {
  try {
    const notifications = await Notification.find({ recipient: userId })
      .populate({
        path: "sender",
        select: "fullName profilePhoto employerProfile.companyName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "relatedJob",
        select: "title",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      notifications: notifications.filter((n) => n.sender),
      unreadCount,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

// Helper function to generate recent activity
function generateRecentActivity(
  userRole: string,
  applications: any[],
  jobs: any[],
  transactions: any[],
  userId: string
): ActivityItem[] {
  const recentActivity: ActivityItem[] = [];

  // Add recent applications based on role
  applications.forEach((app) => {
    if (!app || !app._id || !app.createdAt) return;

    let activityType = "";
    let title = "";
    let description = "";

    switch (userRole) {
      case "specialist":
      case "user":
        activityType = "application_submitted";
        title = `Applied for ${app.job?.title || "Unknown Job"}`;
        description = `Application status: ${app.status || "pending"}`;
        break;
      case "partner":
      case "employer":
        activityType = "application_received";
        title = `New application for ${app.job?.title || "Unknown Job"}`;
        description = `From ${app.applicant?.fullName || "Unknown Applicant"}`;
        break;
      case "admin":
        activityType = "application_activity";
        title = `Application ${app.status || "submitted"}`;
        description = `${app.applicant?.fullName || "User"} applied for ${
          app.job?.title || "job"
        }`;
        break;
      default:
        activityType = "application_activity";
        title = "Application activity";
        description = "Application status updated";
    }

    recentActivity.push({
      type: activityType,
      title,
      description,
      timestamp: app.createdAt,
      relatedId: app._id,
      status: app.status || "pending",
    });
  });

  // Add recent job posts (for employers/partners and admins)
  if (["partner", "employer", "admin"].includes(userRole)) {
    jobs.forEach((job) => {
      if (!job || !job._id || !job.createdAt) return;

      let title = "";
      let description = "";

      if (userRole === "admin") {
        title = `Job posted: "${job.title || "Untitled Job"}"`;
        description = `New job in ${job.category || "general"} category`;
      } else {
        title = `Posted "${job.title || "Untitled Job"}"`;
        description = `${job.applicationsCount || 0} applications received`;
      }

      recentActivity.push({
        type: "job_posted",
        title,
        description,
        timestamp: job.createdAt,
        relatedId: job._id,
        status: job.status || "draft",
      });
    });
  }

  // Add recent transactions
  transactions.forEach((transaction) => {
    if (!transaction || !transaction._id || !transaction.createdAt) return;

    let title = "";
    let description = "";

    if (userRole === "admin") {
      title = "Platform transaction";
      description = `${transaction.amount || 0} ${
        transaction.currency || "USD"
      } transaction`;
    } else {
      const isPayee =
        transaction.payee && transaction.payee._id.toString() === userId;
      title = isPayee ? "Payment received" : "Payment sent";
      description = `${transaction.amount || 0} ${
        transaction.currency || "USD"
      } - ${transaction.job?.title || "Unknown Job"}`;
    }

    recentActivity.push({
      type: "transaction",
      title,
      description,
      timestamp: transaction.createdAt,
      relatedId: transaction._id,
      status: transaction.status || "pending",
    });
  });

  // Sort activity by timestamp
  return recentActivity.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Helper function to calculate profile completion
function calculateProfileCompletion(user: any): number {
  let completionScore = 0;
  const totalFields = 10;

  // Basic fields (common to all roles)
  if (user.fullName) completionScore++;
  if (user.email) completionScore++;
  if (user.profilePhoto) completionScore++;
  if (user.location) completionScore++;
  if (user.bio) completionScore++;

  // Role-specific fields
  switch (user.role) {
    case "specialist":
    case "user":
      if (
        user.skills &&
        typeof user.skills === "object" &&
        Object.keys(user.skills).length > 0
      )
        completionScore++;
      if (
        user.workExperience &&
        Array.isArray(user.workExperience) &&
        user.workExperience.length > 0
      )
        completionScore++;
      if (
        user.education &&
        Array.isArray(user.education) &&
        user.education.length > 0
      )
        completionScore++;
      if (
        user.certifications &&
        Array.isArray(user.certifications) &&
        user.certifications.length > 0
      )
        completionScore++;
      if (user.resume) completionScore++;
      break;

    case "partner":
    case "employer":
      if (user.employerProfile?.companyName) completionScore++;
      if (user.employerProfile?.companyDescription) completionScore++;
      if (user.employerProfile?.industry) completionScore++;
      if (user.employerProfile?.companySize) completionScore++;
      if (user.employerProfile?.companyWebsite) completionScore++;
      break;

    case "admin":
      // For admin, consider profile complete if basic fields are filled
      completionScore += 5; // Max out the remaining fields for admin
      break;

    default:
      // For basic users, just count basic fields as complete
      completionScore += 2; // Add some default completion
      break;
  }

  return Math.round((completionScore / totalFields) * 100);
}

// Export additional helper functions for external use
export const getUserStatsByRole = async (userId: string, role: string) => {
  const stats: UserStats = {};

  switch (role) {
    case "specialist":
    case "user":
      await handleSpecialistData(userId, {}, [], stats);
      break;
    case "partner":
    case "employer":
      await handleEmployerData(userId, {}, [], [], stats);
      break;
    case "admin":
      await handleAdminData(userId, [], [], stats);
      break;
    default:
      await handleBasicUserData(userId, {}, stats);
  }

  return stats;
};

export const getQuickStats = async (userId: string, role: string) => {
  try {
    switch (role) {
      case "specialist":
      case "user":
        const applications = await Application.countDocuments({
          applicant: userId,
        });
        const acceptedApps = await Application.countDocuments({
          applicant: userId,
          status: "accepted",
        });
        return {
          totalApplications: applications,
          acceptedApplications: acceptedApps,
          successRate:
            applications > 0
              ? Math.round((acceptedApps / applications) * 100)
              : 0,
        };

      case "partner":
      case "employer":
        const jobs = await Job.countDocuments({ postedBy: userId });
        const activeJobs = await Job.countDocuments({
          postedBy: userId,
          status: "active",
        });
        return {
          totalJobs: jobs,
          activeJobs: activeJobs,
          completionRate: jobs > 0 ? Math.round((activeJobs / jobs) * 100) : 0,
        };

      case "admin":
        const [totalUsers, totalJobs, totalTransactions] = await Promise.all([
          User.countDocuments(),
          Job.countDocuments(),
          Transaction.countDocuments(),
        ]);
        return {
          totalUsers,
          totalJobs,
          totalTransactions,
        };

      default:
        return {
          profileCompletion: 0,
          accountAge: 0,
        };
    }
  } catch (error) {
    console.error("Error getting quick stats:", error);
    return {};
  }
};
