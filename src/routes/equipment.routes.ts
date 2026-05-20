import { Router } from "express";
import * as equipmentController from "@/controllers/equipment.controller";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(equipmentController.list));
router.delete("/:id", asyncHandler(equipmentController.remove));

export default router;
