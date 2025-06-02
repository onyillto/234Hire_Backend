// src/routes/auth.ts
import express from "express";
import {
  register,
  completeOnboarding,
  login,
  forgotPassword,
  sendVerificationOTP,
  verifyEmailOTP,
  resetPassword,
  verifyForgotPasswordOTP,
  passwordRecovery,
  completePartnerOnboarding,
} from "../controllers/auth";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  registerValidation,
  onboardingValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyForgotPasswordOTPValidation,
  sendVerificationOTPValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  passwordRecoveryValidation,
  partnerOnboardingValidation,
} from "../vallidations/auth.validation";

const router = express.Router();

// Add logging to see if routes are being set up
console.log("🛣️  Setting up auth routes");

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
  protect,
  validate(onboardingValidation),
  completeOnboarding
);



router.post(
  "/partner-onboarding",
  (req, res, next) => {
    console.log("🎯 Auth route /partner-onboarding hit!");
    next();
  },
  protect,
  validate(partnerOnboardingValidation),
  completePartnerOnboarding
);
// Login route
router.post(
  "/login",
  (req, res, next) => {
    console.log("🎯 Auth route /login hit!");
    next();
  },
  validate(loginValidation),
  login
);

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

// Password recovery route (for your password recovery page)
router.post(
  "/password-recovery",
  (req, res, next) => {
    console.log("🎯 Auth route /password-recovery hit!");
    next();
  },
  validate(passwordRecoveryValidation),
  passwordRecovery
);

console.log("✅ Auth routes set up complete");

export default router;
