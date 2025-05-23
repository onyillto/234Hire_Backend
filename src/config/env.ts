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
  MONGODB_URI:
    process.env.MONGODB_URI ,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",

  // Email
  SMTP_HOST: process.env.SMTP_HOST || "smtp.mailtrap.io",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "2525", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@appname.com",
  FROM_NAME: process.env.FROM_NAME || "App Name",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // File upload
  MAX_FILE_UPLOAD: parseInt(process.env.MAX_FILE_UPLOAD || "1000000", 10), // Default 1MB
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || "public/uploads",
};

// Debug: Log the JWT_SECRET (first few characters only for security)
console.log(
  "🔑 JWT_SECRET loaded:",
  env.JWT_SECRET ? `${env.JWT_SECRET.substring(0, 10)}...` : "NOT FOUND"
);

export default env;
