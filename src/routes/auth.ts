// src/routes/auth.routes.ts
import express from "express";
import * as expressValidator from "express-validator";
const { body } = expressValidator;

import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyOTP,
} from "../controllers/auth";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";

const router = express.Router();

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

// Login validation
const loginValidation = [
  body("username").isLength({ min: 1 }).withMessage("Please provide a username or email"),
  body("password").notEmpty().withMessage("Please provide a password"),
];

// Update details validation
const updateDetailsValidation = [
  body("fullName").if(body("fullName").exists()).isString().trim(),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

// Update password validation
const updatePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Please provide current password"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// Forgot password validation
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

// Reset password validation
const resetPasswordValidation = [
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// Verify OTP validation
const verifyOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("otp")
    .isString()
    .isLength({ min: 4, max: 6 })
    .withMessage("Please provide a valid OTP"),
];

// Public routes
router.post("/register", validate(registerValidation), register);
router.post("/login", validate(loginValidation), login);
router.post(
  "/forgotpassword",
  validate(forgotPasswordValidation),
  forgotPassword
);
router.post("/verifyotp", validate(verifyOTPValidation), verifyOTP);
router.put(
  "/resetpassword/:resettoken",
  validate(resetPasswordValidation),
  resetPassword
);

// Protected routes
router.use(protect); // Apply protect middleware to all routes below

router.get("/logout", logout);
router.get("/me", getMe);
router.put("/updatedetails", validate(updateDetailsValidation), updateDetails);
router.put(
  "/updatepassword",
  validate(updatePasswordValidation),
  updatePassword
);

export default router;
