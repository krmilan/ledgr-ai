// index.ts is the entry point — it starts the HTTP server.
// Keeping it separate from app.ts means app.ts stays testable in isolation.

import app from "./app";

const PORT = process.env.PORT || 8080;

// process.env.PORT is set automatically by Render in production.
// We fall back to 8080 locally.
const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║   Ledgr.ai API Server Running      ║
  ║   http://localhost:${PORT}          ║
  ║   Environment: ${process.env.NODE_ENV || "development"}       ║
  ╚════════════════════════════════════╝
  `);
});

// Graceful shutdown — when Render stops your server (SIGTERM signal),
// finish processing current requests before closing.
// This prevents dropped requests during deployments.
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

// Handle uncaught errors that slip past the error handler
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Promise Rejection:", reason);
});