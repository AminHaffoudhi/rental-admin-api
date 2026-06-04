import { Router } from "express";
import * as profileController from "@/controllers/profile.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  changeAdminPasswordSchema,
  updateAdminProfileSchema,
} from "@/validators/profile.validator";

const router = Router();

router.get("/me", asyncHandler(profileController.getMe));
router.patch("/me", validate(updateAdminProfileSchema), asyncHandler(profileController.updateMe));
router.patch(
  "/me/password",
  validate(changeAdminPasswordSchema),
  asyncHandler(profileController.changePassword)
);

export default router;
