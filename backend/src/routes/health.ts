import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { prisma } from "../services/prisma";

const router = Router();

router.get(
  "/detailed",
  asyncHandler(async (_req, res) => {
    // Test database connectivity as part of the health check
    let dbStatus = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "disconnected";
    }

    res.json({
      success: true,
      data: {
        service: "ledgr-ai-backend",
        version: "1.0.0",
        uptime: Math.floor(process.uptime()) + "s",
        database: dbStatus,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
        },
      },
    });
  })
);

export default router;