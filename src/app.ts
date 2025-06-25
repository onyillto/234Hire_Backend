// src/app.ts
import dotenv from "dotenv";
dotenv.config();
import passport from "./config/passport";
import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/database";
import routes from "./routes";
import path from "path";

const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Public test route (before Passport)
app.get("/test", (req: Request, res: Response) => {
  console.log("🎯 Test endpoint hit!");
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

// Initialize Passport after public routes
app.use(passport.initialize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/api/v1", routes);
console.log('successfuy loaded routes');
// Error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error caught:", error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
