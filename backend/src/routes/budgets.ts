import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  listBudgets,
  createBudgetHandler,
  updateBudgetHandler,
  deleteBudgetHandler,
} from "../controllers/budgetController";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listBudgets));

router.post(
  "/",
  validateBody(["category", "limitAmount", "month", "year"]),
  asyncHandler(createBudgetHandler)
);

router.patch("/:id", asyncHandler(updateBudgetHandler));
router.delete("/:id", asyncHandler(deleteBudgetHandler));

export default router;