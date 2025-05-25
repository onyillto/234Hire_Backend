// src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in project root
// This works whether running from src/ or dist/
const envPath = path.resolve(process.cwd(), ".env");
console.log("📁 Loading .env from:", envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file:", result.error.message);
} else {
  console.log("✅ Environment variables loaded successfully");
}

// Define and export environment variables with types
const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",

  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@234hire.com",
  FROM_NAME: process.env.FROM_NAME || "234Hire",

  // Email Security Settings
  SMTP_SECURE: process.env.SMTP_SECURE === "true" || false, // true for 465, false for other ports
  SMTP_TLS_REJECT_UNAUTHORIZED:
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false", // default true

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // File upload
  MAX_FILE_UPLOAD: parseInt(process.env.MAX_FILE_UPLOAD || "1000000", 10), // Default 1MB
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || "public/uploads",
};

// Email configuration validation and warnings
const validateEmailConfig = () => {
  console.log("📧 Email Configuration:");
  console.log(`   SMTP Host: ${env.SMTP_HOST}`);
  console.log(`   SMTP Port: ${env.SMTP_PORT}`);
  console.log(`   SMTP User: ${env.SMTP_USER ? env.SMTP_USER : "❌ NOT SET"}`);
  console.log(
    `   SMTP Password: ${env.SMTP_PASSWORD ? "✅ SET" : "❌ NOT SET"}`
  );
  console.log(`   From Email: ${env.FROM_EMAIL}`);
  console.log(`   From Name: ${env.FROM_NAME}`);

  // Warn about missing email credentials
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.warn(
      "⚠️  Warning: Email credentials not set. Email features will not work."
    );
  }

  // Gmail-specific validation
  if (env.SMTP_HOST === "smtp.gmail.com") {
    console.log("📧 Gmail detected - Make sure you're using an App Password!");

    if (env.SMTP_PORT !== 587 && env.SMTP_PORT !== 465) {
      console.warn(
        "⚠️  Warning: Gmail typically uses port 587 (TLS) or 465 (SSL)"
      );
    }
  }

  // Security recommendations
  if (env.SMTP_PASSWORD && env.SMTP_PASSWORD.length < 10) {
    console.warn(
      "⚠️  Warning: SMTP password seems too short. Make sure you're using an App Password for Gmail."
    );
  }
};

// Run email validation
validateEmailConfig();

// Debug: Log the JWT_SECRET (first few characters only for security)
console.log(
  "🔑 JWT_SECRET loaded:",
  env.JWT_SECRET ? `${env.JWT_SECRET.substring(0, 10)}...` : "NOT FOUND"
);

export default env;
