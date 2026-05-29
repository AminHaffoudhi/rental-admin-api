import { Router } from "express";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import * as categoryController from "@/controllers/category.controller";
import { createCategorySchema, updateCategorySchema } from "@/validators/category.validator";

const router = Router();

router.get("/", asyncHandler(categoryController.list));
router.get("/:id", asyncHandler(categoryController.getById));
router.post("/", validate(createCategorySchema), asyncHandler(categoryController.create));
router.put("/:id", validate(updateCategorySchema), asyncHandler(categoryController.update));
router.delete("/:id", asyncHandler(categoryController.remove));

export default router;
