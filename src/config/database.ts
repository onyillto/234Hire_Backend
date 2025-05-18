// src/config/database.ts
import mongoose from "mongoose";
import logger from "../utils/logger";

// MongoDB connection options
const options = {};

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://briteck:234-hire@cluster0.kmdtlvd.mongodb.net/",
      options
    );

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      logger.error("Unknown error connecting to MongoDB");
    }
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

// Handle application termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed due to app termination");
  process.exit(0);
});
