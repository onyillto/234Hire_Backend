// src/utils/validators.ts
import { Request } from "express";
import * as expressValidator from "express-validator";
const { body, param } = expressValidator;
import { ValidationChain } from "express-validator";

/**
 * Common validation rules that can be reused across routes
 */

// User validation
export const userValidationRules = {
  // Username validation
  username: () =>
    body("username")
      .isString()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),

  // Email validation
  email: () =>
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),

  // Password validation
  password: () =>
    body("password")
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

  // Full name validation
  fullName: () =>
    body("fullName")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Full name is required"),
};

// Authentication validation
export const authValidationRules = {
  // Login validation
  login: (): ValidationChain[] => [
    body("username")
      .notEmpty()
      .withMessage("Please provide a username or email"),
    body("password").notEmpty().withMessage("Please provide a password"),
  ],

  // Register validation
  register: (): ValidationChain[] => [
    userValidationRules.username(),
    userValidationRules.email(),
    userValidationRules.password(),
  ],

  // Reset password validation
  resetPassword: (): ValidationChain[] => [
    userValidationRules.password(),
    body("confirmPassword")
      .isString()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
    param("resettoken")
      .isString()
      .isLength({ min: 32, max: 64 })
      .withMessage("Invalid reset token"),
  ],
};

// Profile validation
export const profileValidationRules = {
  // Onboarding step 1 validation
  onboardingStep1: (): ValidationChain[] => [
    userValidationRules.fullName(),
    body("role")
      .isIn(["user", "specialist", "admin"])
      .withMessage("Role must be either user, specialist, or admin"),
    body("experience")
      .isIn(["0-5", "5-10", "10+"])
      .withMessage("Experience must be either 0-5, 5-10, or 10+"),
    body("about")
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("About must not exceed 500 characters"),
  ],

  // Onboarding step 2 validation
  onboardingStep2: (): ValidationChain[] => [
    body("skills").isObject().withMessage("Skills must be an object"),
    body("skills.fashion").isBoolean().withMessage("Fashion must be a boolean"),
    body("skills.graphicDesigner")
      .isBoolean()
      .withMessage("Graphic designer must be a boolean"),
    body("skills.videoEditor")
      .isBoolean()
      .withMessage("Video editor must be a boolean"),
    body("skills.contentCreator")
      .isBoolean()
      .withMessage("Content creator must be a boolean"),
    body("skills.photographer")
      .isBoolean()
      .withMessage("Photographer must be a boolean"),
    body("skills.writer").isBoolean().withMessage("Writer must be a boolean"),
    body("skills.others").isBoolean().withMessage("Others must be a boolean"),
  ],
};

// Helper function to validate ObjectId
export const validateObjectId = (paramName: string): ValidationChain => {
  return param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`);
};
