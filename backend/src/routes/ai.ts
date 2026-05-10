import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  generateInsightHandler,
  getInsightHandler,
  categorizeHandler,
} from "../controllers/aiController";

const router = Router();

router.use(requireAuth);

router.get("/insights", asyncHandler(getInsightHandler));
router.post("/insights", asyncHandler(generateInsightHandler));
router.post("/categorize", asyncHandler(categorizeHandler));

export default router;