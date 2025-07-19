// src/routes/profile.routes.ts
import express from "express";
import { body } from "express-validator";
import {
  updateProfile,
  getProfile,
  uploadProfileImage,
  deleteProfileImage,
  getProfileImageInfo,
  serveProfileImage,
  profileImageUploadMiddleware,
} from "../controllers/profile";
import { protect } from "../middlewares/auth";
import { getUserOverview } from "../controllers/userOverview";
import { validate } from "../middlewares/validation";

const router = express.Router();

// Add logging to see if routes are being set up (matching your pattern)
console.log("🛣️  Setting up profile routes");

// Update profile validation - COMPLETE CODE WITH FIXED SKILLS VALIDATION
const updateProfileValidation = [
  // Personal Information
  body("fullName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("location")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters"),

  body("principalRole")
    .optional()
    .isString()
    .trim()
    .withMessage("Principal role must be a string"),

  body("yearsOfExperience")
    .optional()
    .isIn(["1", "2", "3", "4", "5+"])
    .withMessage("Years of experience must be one of: 1, 2, 3, 4, 5+"),

  body("otherRoles")
    .optional()
    .isArray()
    .withMessage("Other roles must be an array"),

  body("otherRoles.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each role must be a string"),

  body("bio")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Bio must not exceed 120 characters"),

  body("profilePhoto")
    .optional()
    .isString()
    .withMessage("Profile photo must be a string (URL or path)"),

  // Identity & Contact
  body("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer-not-to-say"])
    .withMessage(
      "Gender must be one of: male, female, other, prefer-not-to-say"
    ),

  body("phone")
    .optional()
    .isString()
    .trim()
    .withMessage("Phone must be a string"),

  // Social Media Links
  body("website")
    .optional()
    .isString()
    .trim()
    .withMessage("Website must be a string"),

  body("linkedin")
    .optional()
    .isString()
    .trim()
    .withMessage("LinkedIn must be a string"),

  body("twitter")
    .optional()
    .isString()
    .trim()
    .withMessage("Twitter must be a string"),

  body("github")
    .optional()
    .isString()
    .trim()
    .withMessage("GitHub must be a string"),

  // Professional Profile Arrays
  body("workExperience")
    .optional()
    .isArray()
    .withMessage("Work experience must be an array"),

  body("workExperience.*.jobTitle")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Job title is required and must be a string"),

  body("workExperience.*.company")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Company is required and must be a string"),

  body("workExperience.*.startDate")
    .optional()
    .isString()
    .withMessage("Start date is required and must be a string"),

  body("workExperience.*.endDate")
    .optional()
    .isString()
    .withMessage("End date must be a string"),

  body("workExperience.*.currentlyWorking")
    .optional()
    .isBoolean()
    .withMessage("Currently working must be a boolean"),

  body("workExperience.*.location")
    .optional()
    .isString()
    .trim()
    .withMessage("Work location must be a string"),

  body("workExperience.*.employmentType")
    .optional()
    .isIn([
      "remote",
      "full-time",
      "part-time",
      "contract",
      "freelance",
      "internship",
    ])
    .withMessage(
      "Employment type must be one of: remote, full-time, part-time, contract, freelance, internship"
    ),

  body("workExperience.*.description")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Description is required and must be a string"),

  // Certifications validation
  body("certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array"),

  body("certifications.*.certificationName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Certification name is required and must be a string"),

  body("certifications.*.issuingOrganization")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Issuing organization is required and must be a string"),

  body("certifications.*.credentialId")
    .optional()
    .isString()
    .trim()
    .withMessage("Credential ID must be a string"),

  body("certifications.*.credentialUrl")
    .optional()
    .isString()
    .trim()
    .withMessage("Credential URL must be a string"),

  body("certifications.*.certificateImage")
    .optional()
    .isString()
    .withMessage("Certificate image must be a string"),

  // Education validation
  body("education")
    .optional()
    .isArray()
    .withMessage("Education must be an array"),

  body("education.*.school")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("School is required and must be a string"),

  body("education.*.degreeType")
    .optional()
    .isIn([
      "high-school",
      "associate",
      "bachelor",
      "master",
      "doctorate",
      "certificate",
      "diploma",
    ])
    .withMessage(
      "Degree type must be one of: high-school, associate, bachelor, master, doctorate, certificate, diploma"
    ),

  body("education.*.fieldOfStudy")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Field of study is required and must be a string"),

  body("education.*.attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),

  body("education.*.attachments.*")
    .optional()
    .isString()
    .withMessage("Each attachment must be a string"),

  body("resume")
    .optional()
    .isString()
    .withMessage("Resume must be a string (URL or path)"),

  // Existing fields validation
  body("role")
    .optional()
    .isIn(["user", "specialist", "admin"])
    .withMessage("Role must be one of: user, specialist, admin"),

  body("experience")
    .optional()
    .isIn(["0-5", "5-10", "10+"])
    .withMessage("Experience must be one of: 0-5, 5-10, 10+"),

  body("about")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("About section must not exceed 500 characters"),

  // FIXED SKILLS VALIDATION
  body("skills")
    .optional()
    .custom((value) => {
      // Just check if it's a valid JSON-like structure
      return value === null || value === undefined || typeof value === "object";
    })
    .withMessage("Skills must be a valid object"),
];

// Get profile route - PROTECTED
router.get(
    "/",
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.log("🎯 Profile route / (GET) hit!");
        next();
    },
    protect, // Authentication middleware
    getProfile
);

// Update profile route - PROTECTED
router.put(
  "/update",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log("🎯 Profile route /update (PUT) hit!");
    next();
  },
  protect, // Authentication middleware
  validate(updateProfileValidation),
  updateProfile
);




// ===== PROFILE IMAGE ROUTES =====

// Upload profile image
router.post(
  '/upload-image',
  protect,
  profileImageUploadMiddleware,
  uploadProfileImage
);

// Delete profile image
router.delete('/delete-image', protect, deleteProfileImage);

// Get profile image info (metadata) - from token
router.get('/image-info', protect, getProfileImageInfo);

// Serve profile image file - from token
router.get('/image', protect, serveProfileImage);


// ===== PROFILE UPDATE ROUTE =====

// Update profile (your existing endpoint)
router.put('/update', protect, updateProfile);
console.log("✅ Profile routes set up complete");

router.get("/overview", protect, getUserOverview);


export default router;

