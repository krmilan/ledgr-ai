// app.ts sets up Express and all its middleware.
// We separate this from index.ts so we can import just the app in tests
// without starting the server. This is a standard testing pattern.

import healthRouter from "./routes/health";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file into process.env
// Must be called before anything that reads process.env
dotenv.config();

const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) controls which domains can call your API.
// Without this, browsers block requests from your frontend (different domain) to your backend.

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000", // Always allow local dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true, // Allow cookies and Authorization headers
    allowedHeaders: ["Content-Type", "Authorization"], // CRITICAL: must include Authorization
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// ─── Body Parsing ────────────────────────────────────────────────────
// These two lines let Express read JSON bodies in POST/PUT requests.
// Without them, req.body is always undefined.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────
// A /health endpoint is standard practice. Render uses it to verify your
// server is running. Monitoring tools ping it. Interviewers ask about it.
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Ledgr.ai API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── Routes ──────────────────────────────────────────────────────────
// Routes will be imported and registered here in later steps.
// Example: app.use("/api/transactions", transactionsRouter);
app.use("/api/health", healthRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────
// If no route matched, return a clean 404 JSON response.
// Must come AFTER all routes.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────
// Express's special 4-argument middleware catches errors thrown anywhere in the app.
// When you call next(error) or throw inside an async function (with our wrapper),
// execution jumps here. ONE centralized place handles all errors.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err.message);
    console.error(err.stack);

    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error" // Never expose stack traces in production
          : err.message,           // Show details in development
    });
  }
);

export default app;