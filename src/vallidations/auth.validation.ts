import { body } from "express-validator";

export const registerValidation = [
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

export const onboardingValidation = [
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

export const loginValidation = [
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

export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export const verifyForgotPasswordOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("otp")
    .isString()
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be 4 digits"),
];

export const sendVerificationOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export const verifyOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("otp")
    .isString()
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be 4 digits"),
];

export const resetPasswordValidation = [
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

export const passwordRecoveryValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("confirmPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Confirm password must be at least 8 characters"),
];
export const partnerOnboardingValidation = [
  body("fullName")
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("role")
    .custom((value) => value === "partner")
    .withMessage("Role must be partner"),
  body("about")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("About section must not exceed 500 characters"),
  body("companyName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),
  body("industry")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Industry is required"),
  body("projectType")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Project type is required"),
  body("companySize")
    .optional()
    .isIn(["1-10", "11-50", "51-200", "201-500", "500+"])
    .withMessage("Invalid company size"),
  body("companyDescription")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Company description must not exceed 1000 characters"),
  body("companyWebsite").optional().isString().trim(),
  body("companyLocation").optional().isString().trim(),
  body("foundedYear")
    .optional()
    .custom((value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        throw new Error("Invalid founded year");
      }
      return true;
    }),
  body("companyType")
    .optional()
    .isIn(["startup", "corporate", "agency", "nonprofit", "government"])
    .withMessage("Invalid company type"),
];