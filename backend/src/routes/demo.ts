import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { seedDemoData, clearDemoData } from "../controllers/demoController";

const router = Router();

router.use(requireAuth);

// POST /api/demo/seed  — loads demo transactions + budgets
router.post("/seed", asyncHandler(seedDemoData));

// DELETE /api/demo/clear — wipes all user data
router.delete("/clear", asyncHandler(clearDemoData));

export default router;