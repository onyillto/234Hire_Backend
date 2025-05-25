// src/routes/auth.ts
import express from "express";
import { body } from "express-validator";
import {
  register,
  completeOnboarding,
  login,
  forgotPassword,
  sendVerificationOTP,
  verifyEmailOTP,
  resetPassword,
  verifyForgotPasswordOTP,
} from "../controllers/auth";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";

const router = express.Router();

// Add logging to see if routes are being set up
console.log("🛣️  Setting up auth routes");

// Register validation
const registerValidation = [
  body("username")
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// Onboarding validation
const onboardingValidation = [
  body("fullName")
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("role")
    .isIn(["user", "specialist", "admin"])
    .withMessage("Role must be either user, specialist, or admin"),
  body("experience")
    .optional()
    .isIn(["0-5", "5-10", "10+"])
    .withMessage("Experience must be 0-5, 5-10, or 10+"),
  body("about")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("About section must not exceed 500 characters"),
  body("selectedSkills")
    .optional()
    .isArray()
    .withMessage("Selected skills must be an array"),
];

// Register route
router.post(
  "/register",
  (req, res, next) => {
    console.log("🎯 Auth route /register hit!");
    next();
  },
  validate(registerValidation),
  register
);

// Onboarding route - PROTECTED
router.post(
  "/onboarding",
  (req, res, next) => {
    console.log("🎯 Auth route /onboarding hit!");
    next();
  },
  protect, // This middleware authenticates the user
  validate(onboardingValidation),
  completeOnboarding
);



// Login validation (add this after registerValidation)
const loginValidation = [
  body("username")
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// Login route (add this after register route)
router.post(
  "/login",
  (req, res, next) => {
    console.log("🎯 Auth route /login hit!");
    next();
  },
  validate(loginValidation),
  login
);



// Forgot password validation
// Forgot password OTP validation
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

// Verify forgot password OTP validation
const verifyForgotPasswordOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("otp")
    .isString()
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be 4 digits"),
];

// Forgot password route (sends OTP)
router.post(
  "/forgot-password",
  (req, res, next) => {
    console.log("🎯 Auth route /forgot-password hit!");
    next();
  },
  validate(forgotPasswordValidation),
  forgotPassword
);

// Verify forgot password OTP route
router.post(
  "/verify-forgot-password-otp",
  (req, res, next) => {
    console.log("🎯 Auth route /verify-forgot-password-otp hit!");
    next();
  },
  validate(verifyForgotPasswordOTPValidation),
  verifyForgotPasswordOTP
);



// Send verification OTP validation
const sendVerificationOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

// Verify OTP validation
const verifyOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("otp")
    .isString()
    .isLength({ min: 4, max: 4 }) // Changed from 6 to 4
    .withMessage("Verification code must be 4 digits"),
];


// Send verification OTP route
router.post(
  "/send-verification-otp",
  (req, res, next) => {
    console.log("🎯 Auth route /send-verification-otp hit!");
    next();
  },
  validate(sendVerificationOTPValidation),
  sendVerificationOTP
);

// Verify email OTP route
router.post(
  "/verify-email-otp",
  (req, res, next) => {
    console.log("🎯 Auth route /verify-email-otp hit!");
    next();
  },
  validate(verifyOTPValidation),
  verifyEmailOTP
);



// Reset password validation
const resetPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("confirmPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Confirm password must be at least 8 characters"),
];

// Reset password route
router.post(
  "/reset-password",
  (req, res, next) => {
    console.log("🎯 Auth route /reset-password hit!");
    next();
  },
  validate(resetPasswordValidation),
  resetPassword
);


console.log("✅ Auth routes set up complete");

export default router;
