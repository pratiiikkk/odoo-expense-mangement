import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth";
import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import countryRoutes from "./routes/countryRoutes";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Mount Better Auth handler BEFORE express.json()
// This is critical - Better Auth needs to handle raw request body
app.use("/api/auth", toNodeHandler(auth));

// Mount express.json() middleware AFTER Better Auth handler
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Get current session (example endpoint)
app.get("/api/session", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "No active session" });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// API Routes
app.use("/api/auth-custom", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", countryRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📍 Better Auth endpoint: http://localhost:${port}/api/auth`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
