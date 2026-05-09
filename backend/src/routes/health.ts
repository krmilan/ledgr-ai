import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

// GET /api/health/detailed
// Returns more detailed info than the root /health check
router.get(
  "/detailed",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        service: "ledgr-ai-backend",
        version: "1.0.0",
        uptime: Math.floor(process.uptime()) + "s",
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
        },
      },
    });
  })
);

export default router;