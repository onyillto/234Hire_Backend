import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
// import { connectDB } from "./config/database";
// import routes from "./routes";
// import { errorHandler } from "./middlewares/error.middleware";

const app: Application = express();

// Connect to MongoDB
// connectDB();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
// app.use("/api/v1", routes);

// Error handling middleware
// app.use(errorHandler);

export default app;
