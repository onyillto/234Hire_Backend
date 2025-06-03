import { body } from "express-validator";

export const applyJobValidation = [
  body("coverLetter")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Cover letter must not exceed 1000 characters"),

  body("resumeUrl")
    .optional()
    .isString()
    .trim()
    .withMessage("Resume URL must be a valid string"),
];


export const updateApplicationStatusValidation = [
  body("status")
    .isIn(["pending", "reviewed", "accepted", "rejected"])
    .withMessage("Status must be: pending, reviewed, accepted, or rejected"),
];
