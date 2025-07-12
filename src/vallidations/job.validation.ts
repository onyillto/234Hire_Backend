import { body } from "express-validator";

export const createJobValidation = [
  body("title")
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Job title must be between 3 and 100 characters"),

  body("description")
    .isString()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Job description must be between 20 and 2000 characters"),

  body("location")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),

  body("jobType")
    .isIn(["full-time", "part-time", "contract", "freelance", "internship"])
    .withMessage("Invalid job type"),

  body("workType")
    .isIn(["remote", "onsite", "hybrid"])
    .withMessage("Invalid work type"),

  body("skills")
    .isArray()
    .withMessage("At least one skill is required"),

  body("experience")
    .isIn(["entry-level", "1-2 years", "3-5 years", "5-10 years", "10+ years"])
    .withMessage("Invalid experience level"),

  body("salaryMin")
    .optional()
    .isInt()
    .withMessage("Minimum salary must be positive"),

  body("salaryMax")
    .optional()
    .isInt()
    .withMessage("Maximum salary must be positive"),

  body("applicationEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid application email"),

  body("category")
    .optional()
    .isIn([
      "engineering",
      "design",
      "marketing",
      "sales",
      "operations",
      "finance",
      "hr",
      "customer-support",
      "product",
      "data",
      "other",
    ])
    .withMessage("Invalid category"),
];


// src/validations/job.validation.ts
export const updateJobValidation = [
  body("title")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Job title must be between 3 and 100 characters"),
  
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Job description must be between 20 and 2000 characters"),
  
 
  
  body("jobType")
    .optional()
    .isIn(["full-time", "part-time", "contract", "freelance", "internship"])
    .withMessage("Invalid job type"),
  
  body("workType")
    .optional()
    .isIn(["remote", "onsite", "hybrid"])
    .withMessage("Invalid work type"),
  
  body("status")
    .optional()
    .isIn(["active", "paused", "closed", "draft"])
    .withMessage("Invalid job status"),
  
  body("skills")
    .optional()
    .isArray()
    .withMessage("At least one skill is required when provided"),
  
  body("experience")
    .optional()
    .isIn(["entry-level", "1-2 years", "3-5 years", "5-10 years", "10+ years"])
    .withMessage("Invalid experience level"),
  
  // FIX: Remove the problematic custom validation for updates
  body("salaryMin")
    .optional()
    .isInt()
    .withMessage("Minimum salary must be positive"),
  
  body("salaryMax")
    .optional()
    .custom((value) => Number.isInteger(value) && value >= 0)
    .withMessage("Maximum salary must be a positive integer"),
  
  body("applicationEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid application email"),
  
  body("category")
    .optional()
    .isIn(["engineering", "design", "marketing", "sales", "operations", "finance", "hr", "customer-support", "product", "data", "other"])
    .withMessage("Invalid category")
];