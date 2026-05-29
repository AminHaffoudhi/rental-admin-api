import { Router } from "express";
import * as reviewController from "@/controllers/review.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { rejectReviewSchema } from "@/validators/review.validator";

const router = Router();

router.get("/", asyncHandler(reviewController.list));
router.post("/:id/approve", asyncHandler(reviewController.approve));
router.post("/:id/reject", validate(rejectReviewSchema), asyncHandler(reviewController.reject));
router.delete("/:id", asyncHandler(reviewController.remove));

export default router;
