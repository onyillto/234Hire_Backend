import env from "./config/env";
import app from "./app";
import { connectDB } from "./config/database";

const PORT = env.PORT;

// Connect to Database, then start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
