import { Router } from "express";
import * as disputeController from "@/controllers/dispute.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { resolveDisputeSchema } from "@/validators/dispute.validator";

const router = Router();

router.get("/", asyncHandler(disputeController.list));
router.get("/:id", asyncHandler(disputeController.getById));
router.post("/:id/resolve", validate(resolveDisputeSchema), asyncHandler(disputeController.resolve));

export default router;
