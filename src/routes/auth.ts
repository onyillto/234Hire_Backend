// src/routes/auth.ts
import express from "express";
import { body } from "express-validator";
import { register } from "../controllers/auth";
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

console.log("✅ Auth routes set up complete");

export default router;
