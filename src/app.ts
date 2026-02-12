// src/app.ts
import passport from "./config/passport";
import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes";
import path from "path";

const app: Application = express();
app.use((req, res, next) => {
  console.log(`📨 Incoming: ${req.method} ${req.url}`);
  next();
});

// CORS - handles OPTIONS requests automatically
app.use(
  cors({
    origin: true, // Allow dynamic origin for development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Test route
app.get("/test", (req: Request, res: Response) => {
  console.log("✅ Test endpoint hit!");
  res.status(200).json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "234Hire API is running",
    version: "1.0.0",
  });
});

// Favicon
app.get("/favicon.ico", (req, res) => res.status(204).send());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Passport
app.use(passport.initialize());

// API routes
app.use("/api/v1", routes);

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error caught:", error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
});

export default app;
