import { Router } from "express";
import * as deliveryController from "@/controllers/delivery.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { assignAgentSchema, updateDeliveryStatusSchema } from "@/validators/delivery.validator";

const router = Router();

router.get("/", asyncHandler(deliveryController.list));
router.post(
  "/:id/assign-agent",
  validate(assignAgentSchema),
  asyncHandler(deliveryController.assignAgent)
);
router.put(
  "/:id/status",
  validate(updateDeliveryStatusSchema),
  asyncHandler(deliveryController.updateStatus)
);

export default router;
