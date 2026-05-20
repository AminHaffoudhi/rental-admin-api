import { Router } from "express";
import * as paymentController from "@/controllers/payment.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendPayoutSchema } from "@/validators/payment.validator";

const router = Router();

router.get("/", asyncHandler(paymentController.list));
router.get("/:id", asyncHandler(paymentController.getById));
router.post("/:id/payout", validate(sendPayoutSchema), asyncHandler(paymentController.payout));

export default router;
