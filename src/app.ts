// src/app.ts
import dotenv from "dotenv";
dotenv.config();
import passport from "./config/passport";
import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/database";
import routes from "./routes";

const app: Application = express();
app.use(passport.initialize());
// Connect to MongoDB
connectDB();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("📝 Request Body:", req.body);
  console.log("📋 Request Headers:", req.headers);
  next();
});

// Routes
app.use("/api/v1", routes);

// Add a simple test route
app.get("/test", (req: Request, res: Response) => {
  console.log("🎯 Test endpoint hit!");
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

// Add another test for the API path
app.get("/api/v1/test", (req: Request, res: Response) => {
  console.log("🎯 API test endpoint hit!");
  res.json({
    message: "API route is working!",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.log("❌ Error caught:", error);
  console.log("📍 Error at:", req.method, req.path);

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
