import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate.middleware";
import { adminLoginSchema } from "@/validators/auth.validator";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.post("/login", validate(adminLoginSchema), asyncHandler(authController.login));

export default router;
