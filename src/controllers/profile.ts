// src/controllers/profile.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { ErrorResponse } from "../utils/error-response";
import {
  FileManager,
  ImageValidator,
  uploadSingle,
} from "../utils/imageUpload";

// Interface for authenticated requests (matching your auth pattern)
interface AuthenticatedRequest extends Request {
  user?: {
    _id?: any; // MongoDB ObjectId
    id?: string; // String version
    role?: string; // Optional since it's optional in your model
    [key: string]: any;
  };
}

// @desc   Update user profile   
// @route  PUT /api/v1/profile/update
// @access Private
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // FIX 1: Use _id instead of id (MongoDB uses _id)
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    console.log("🔍 Debug - Update profile request for user:", userId);
    console.log("📝 Debug - Request body:", req.body);

    // Find the user first
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    console.log("✅ Debug - User found:", user.username);

    // Extract update data from request body
    const {
      // Personal Information
      fullName,
      location,
      principalRole,
      yearsOfExperience,
      otherRoles,
      bio,
      profilePhoto,

      // Identity & Contact
      gender,
      phone,

      // Social Media Links
      website,
      linkedin,
      twitter,
      github,

      // Professional Profile
      workExperience,
      certifications,
      education,
      resume,

      // Existing fields
      role,
      experience,
      about,
      skills,
    } = req.body;

    // Validate enum fields (additional server-side validation)
    if (
      yearsOfExperience &&
      !["1", "2", "3", "4", "5+"].includes(yearsOfExperience)
    ) {
      return next(
        new ErrorResponse(
          "Invalid years of experience value. Must be one of: 1, 2, 3, 4, 5+",
          400
        )
      );
    }

    if (
      gender &&
      !["male", "female", "other", "prefer-not-to-say"].includes(gender)
    ) {
      return next(
        new ErrorResponse(
          "Invalid gender value. Must be one of: male, female, other, prefer-not-to-say",
          400
        )
      );
    }

    if (role && !["user", "specialist", "admin"].includes(role)) {
      return next(
        new ErrorResponse(
          "Invalid role value. Must be one of: user, specialist, admin",
          400
        )
      );
    }

    if (experience && !["0-5", "5-10", "10+"].includes(experience)) {
      return next(
        new ErrorResponse(
          "Invalid experience value. Must be one of: 0-5, 5-10, 10+",
          400
        )
      );
    }

    // Validate work experience employment types
    if (workExperience && Array.isArray(workExperience)) {
      const validEmploymentTypes = [
        "remote",
        "full-time",
        "part-time",
        "contract",
        "freelance",
        "internship",
      ];
      for (const exp of workExperience) {
        if (
          exp.employmentType &&
          !validEmploymentTypes.includes(exp.employmentType)
        ) {
          return next(
            new ErrorResponse(
              `Invalid employment type: ${
                exp.employmentType
              }. Must be one of: ${validEmploymentTypes.join(", ")}`,
              400
            )
          );
        }

        // Validate required fields for work experience
        if (
          !exp.jobTitle ||
          !exp.company ||
          !exp.startDate ||
          !exp.description
        ) {
          return next(
            new ErrorResponse(
              "Work experience must include jobTitle, company, startDate, and description",
              400
            )
          );
        }
      }
    }

    // Validate education degree types
    if (education && Array.isArray(education)) {
      const validDegreeTypes = [
        "high-school",
        "associate",
        "bachelor",
        "master",
        "doctorate",
        "certificate",
        "diploma",
      ];
      for (const edu of education) {
        if (!validDegreeTypes.includes(edu.degreeType)) {
          return next(
            new ErrorResponse(
              `Invalid degree type: ${
                edu.degreeType
              }. Must be one of: ${validDegreeTypes.join(", ")}`,
              400
            )
          );
        }

        // Validate required fields for education
        if (!edu.school || !edu.degreeType || !edu.fieldOfStudy) {
          return next(
            new ErrorResponse(
              "Education must include school, degreeType, and fieldOfStudy",
              400
            )
          );
        }
      }
    }

    // Validate certifications
    if (certifications && Array.isArray(certifications)) {
      for (const cert of certifications) {
        if (!cert.certificationName || !cert.issuingOrganization) {
          return next(
            new ErrorResponse(
              "Certifications must include certificationName and issuingOrganization",
              400
            )
          );
        }
      }
    }

    // Validate string lengths (matching your model constraints)
    if (bio && bio.length > 120) {
      return next(new ErrorResponse("Bio must not exceed 120 characters", 400));
    }

    if (location && location.length > 100) {
      return next(
        new ErrorResponse("Location must not exceed 100 characters", 400)
      );
    }

    if (about && about.length > 500) {
      return next(
        new ErrorResponse("About must not exceed 500 characters", 400)
      );
    }

    // Update user fields (only update fields that are provided)
    if (fullName !== undefined) user.fullName = fullName;
    if (location !== undefined) user.location = location;
    if (principalRole !== undefined) user.principalRole = principalRole;
    if (yearsOfExperience !== undefined)
      user.yearsOfExperience = yearsOfExperience;
    if (otherRoles !== undefined) user.otherRoles = otherRoles;
    if (bio !== undefined) user.bio = bio;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (gender !== undefined) user.gender = gender;
    if (phone !== undefined) user.phone = phone;
    if (website !== undefined) user.website = website;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (twitter !== undefined) user.twitter = twitter;
    if (github !== undefined) user.github = github;
    if (workExperience !== undefined) user.workExperience = workExperience;
    if (certifications !== undefined) user.certifications = certifications;
    if (education !== undefined) user.education = education;
    if (resume !== undefined) user.resume = resume;
    if (role !== undefined) user.role = role;
    if (experience !== undefined) user.experience = experience;
    if (about !== undefined) user.about = about;

    // FIX 2: Handle skills conversion - SIMPLIFIED AND WORKING
    if (skills !== undefined) {
      console.log("🔍 Debug - Skills input:", skills, typeof skills);

      if (Array.isArray(skills)) {
        // If skills is an array (like selectedSkills in onboarding)
        const skillsObject: Record<string, string> = {};
        skills.forEach((skill: any) => {
          if (skill.value && skill.label) {
            skillsObject[skill.value] = skill.label;
          }
        });
        user.skills = skillsObject;
        console.log("✅ Debug - Skills converted from array to object");
      } else if (typeof skills === "object" && skills !== null) {
        // If skills is an object (from Postman), assign directly
        user.skills = skills;
        console.log("✅ Debug - Skills assigned directly from object");
      } else if (skills === null) {
        // Clear skills if explicitly set to null
        user.skills = {};
        console.log("✅ Debug - Skills cleared");
      }

      console.log("🔍 Debug - Final skills object:", user.skills);
    }

    // Save the updated user
    await user.save();

    console.log("✅ Debug - Profile updated successfully");

    // Helper function to convert skills to plain object (matching your pattern)
    const getSkillsAsObject = (skills: any) => {
      if (!skills) return {};

      // If it's already a Map, convert to object
      if (skills instanceof Map) {
        return Object.fromEntries(skills);
      }

      // If it's already an object, return as is
      if (typeof skills === "object") {
        return skills;
      }

      return {};
    };

    // Return success response (matching your response pattern)
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        experience: user.experience,
        about: user.about,
        skills: getSkillsAsObject(user.skills),
        // New profile fields
        location: user.location,
        principalRole: user.principalRole,
        yearsOfExperience: user.yearsOfExperience,
        otherRoles: user.otherRoles,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        gender: user.gender,
        phone: user.phone,
        website: user.website,
        linkedin: user.linkedin,
        twitter: user.twitter,
        github: user.github,
        workExperience: user.workExperience,
        certifications: user.certifications,
        education: user.education,
        resume: user.resume,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.log("❌ Debug - Error in updateProfile:", error);

    // Handle MongoDB validation errors (matching your pattern)
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      const message = errors.join(". ");
      return next(new ErrorResponse(message, 400));
    }

    // Handle MongoDB duplicate key errors (matching your pattern)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      const message = `${duplicateField} "${duplicateValue}" already exists. Please choose a different ${duplicateField}.`;
      return next(new ErrorResponse(message, 400));
    }

    next(error);
  }
};
// @desc   Get user profile
// @route  GET /api/v1/profile
// @access Private
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    console.log("🔍 Debug - Get profile request for user:", userId);

    // Find the user (exclude sensitive fields - matching your auth pattern)
    const user = await User.findById(userId).select(
      "-password -emailVerificationOTP -emailVerificationOTPExpire -forgotPasswordOTP -forgotPasswordOTPExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    console.log("✅ Debug - Profile retrieved successfully");

    // Helper function to convert skills to plain object (matching your onboarding pattern)
    const getSkillsAsObject = (skills: any) => {
      if (!skills) return {};

      if (skills instanceof Map) {
        return Object.fromEntries(skills);
      }

      if (typeof skills === "object") {
        return skills;
      }

      return {};
    };

    // Return response (matching your response pattern)
    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        experience: user.experience,
        about: user.about,
        skills: getSkillsAsObject(user.skills),
        // New profile fields
        location: user.location,
        principalRole: user.principalRole,
        yearsOfExperience: user.yearsOfExperience,
        otherRoles: user.otherRoles,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        gender: user.gender,
        phone: user.phone,
        website: user.website,
        linkedin: user.linkedin,
        twitter: user.twitter,
        github: user.github,
        workExperience: user.workExperience,
        certifications: user.certifications,
        education: user.education,
        resume: user.resume,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.log("❌ Debug - Error in getProfile:", error);
    next(error);
  }
};




// @desc   Upload profile image
// @route  POST /api/v1/profile/upload-image
// @access Private
export const uploadProfileImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    if (!req.file) {
      return next(new ErrorResponse("Please upload an image file", 400));
    }

    console.log("🔍 Debug - Image upload request for user:", userId);

    // Validate the uploaded image
    const validation = ImageValidator.validateImage(req.file);
    if (!validation.isValid) {
      FileManager.cleanupUploadedFile(req.file);
      return next(new ErrorResponse(validation.error!, 400));
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      FileManager.cleanupUploadedFile(req.file);
      return next(new ErrorResponse("User not found", 404));
    }

    // Delete old profile image if it exists
    if (user.profilePhoto) {
      FileManager.deleteFile(user.profilePhoto);
    }

    // Get file info and update user
    const fileInfo = ImageValidator.getFileInfo(req.file, req);
    user.profilePhoto = fileInfo.filePath;
    await user.save();

    console.log("✅ Debug - Profile image updated successfully");

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profilePhoto: fileInfo.filePath,
        profilePhotoUrl: fileInfo.fileUrl,
        fileInfo: {
          originalName: fileInfo.originalName,
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
        },
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePhoto: fileInfo.filePath,
          profilePhotoUrl: fileInfo.fileUrl,
        }
      },
    });
  } catch (error: any) {
    console.log("❌ Debug - Error in uploadProfileImage:", error);
    
    // Clean up uploaded file on error
    FileManager.cleanupUploadedFile(req.file);
    next(error);
  }
};

// @desc   Delete profile image
// @route  DELETE /api/v1/profile/delete-image
// @access Private
export const deleteProfileImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("User not found in request", 500));
    }

    console.log("🔍 Debug - Delete profile image request for user:", userId);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (!user.profilePhoto) {
      return next(new ErrorResponse("No profile image to delete", 400));
    }

    // Delete the image file
    const deleted = FileManager.deleteFile(user.profilePhoto);
    if (!deleted) {
      console.log("⚠️ Warning - Could not delete image file, but will remove from database");
    }

    // Remove profile image from user record
    user.profilePhoto = undefined;
    await user.save();

    console.log("✅ Debug - Profile image deleted successfully");

    res.status(200).json({
      success: true,
      message: "Profile image deleted successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePhoto: null,
        }
      },
    });
  } catch (error: any) {
    console.log("❌ Debug - Error in deleteProfileImage:", error);
    next(error);
  }
};

// @desc   Get profile image info
// @route  GET /api/v1/profile/image-info (authenticated) or GET /api/v1/profile/image-info/:userId (public)
// @access Private/Public
export const getProfileImageInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from token (authenticated) or URL params (public)
    const userId = (req as AuthenticatedRequest).user?._id || 
                   (req as AuthenticatedRequest).user?.id || 
                   req.params.userId;

    if (!userId) {
      return next(new ErrorResponse("User ID not provided", 400));
    }

    console.log("🔍 Debug - Get profile image info for user:", userId);

    // Find the user
    const user = await User.findById(userId).select('profilePhoto username fullName');
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (!user.profilePhoto) {
      return next(new ErrorResponse("No profile image found", 404));
    }

    // Check if file exists
    const fileExists = FileManager.fileExists(user.profilePhoto);
    if (!fileExists) {
      return next(new ErrorResponse("Profile image file not found", 404));
    }

    // Get file info
    const fileSize = FileManager.getFileSize(user.profilePhoto);
    const fileUrl = FileManager.generateFileUrl(req, user.profilePhoto);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
        },
        image: {
          filePath: user.profilePhoto,
          fileUrl: fileUrl,
          fileSize: fileSize,
          exists: fileExists,
        }
      },
    });
  } catch (error: any) {
    console.log("❌ Debug - Error in getProfileImageInfo:", error);
    next(error);
  }
};

// @desc   Serve profile image file
// @route  GET /api/v1/profile/image (authenticated) or GET /api/v1/profile/image/:userId (public)
// @access Private/Public
export const serveProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from token (authenticated) or URL params (public)
    const userId = (req as AuthenticatedRequest).user?._id || 
                   (req as AuthenticatedRequest).user?.id || 
                   req.params.userId;

    if (!userId) {
      return next(new ErrorResponse("User ID not provided", 400));
    }

    // Find the user
    const user = await User.findById(userId).select('profilePhoto');
    if (!user || !user.profilePhoto) {
      return next(new ErrorResponse("Profile image not found", 404));
    }

    // Check if file exists and serve it
    if (FileManager.fileExists(user.profilePhoto)) {
      const fullPath = require('path').join(process.cwd(), user.profilePhoto);
      res.sendFile(fullPath);
    } else {
      return next(new ErrorResponse("Profile image file not found", 404));
    }
  } catch (error: any) {
    console.log("❌ Debug - Error in serveProfileImage:", error);
    next(error);
  }
};

// Export the multer middleware
export { uploadSingle as profileImageUploadMiddleware };
