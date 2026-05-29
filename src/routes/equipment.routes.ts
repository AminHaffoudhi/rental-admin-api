import { Router } from "express";
import * as equipmentController from "@/controllers/equipment.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { rejectEquipmentSchema } from "@/validators/equipment.validator";

const router = Router();

router.get("/", asyncHandler(equipmentController.list));
router.post("/:id/approve", asyncHandler(equipmentController.approve));
router.post(
  "/:id/reject",
  validate(rejectEquipmentSchema),
  asyncHandler(equipmentController.reject)
);
router.delete("/:id", asyncHandler(equipmentController.remove));

export default router;
