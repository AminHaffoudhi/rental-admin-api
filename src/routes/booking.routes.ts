import { Router } from "express";
import * as bookingController from "@/controllers/booking.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { confirmPaymentSchema } from "@/validators/payment.validator";

const router = Router();

router.get("/", asyncHandler(bookingController.list));
router.get("/:id", asyncHandler(bookingController.getById));
router.post(
  "/:id/confirm-payment",
  validate(confirmPaymentSchema),
  asyncHandler(bookingController.confirmPayment)
);
router.post("/:id/force-complete", asyncHandler(bookingController.forceComplete));
router.post("/:id/force-cancel", asyncHandler(bookingController.forceCancel));

export default router;
