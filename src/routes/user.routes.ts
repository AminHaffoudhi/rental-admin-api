import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { blockUserSchema, kycActionSchema, updateRoleSchema } from "@/validators/user.validator";

const router = Router();

router.get("/", asyncHandler(userController.list));
router.get("/:id", asyncHandler(userController.getById));
router.post("/:id/kyc/approve", asyncHandler(userController.approveKyc));
router.post("/:id/kyc/reject", validate(kycActionSchema), asyncHandler(userController.rejectKyc));
router.put("/:id/role", validate(updateRoleSchema), asyncHandler(userController.updateRole));
router.post("/:id/block", validate(blockUserSchema), asyncHandler(userController.block));
router.post("/:id/unblock", asyncHandler(userController.unblock));

export default router;
