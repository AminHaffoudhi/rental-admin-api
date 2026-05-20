import { Router } from "express";
import * as notificationsController from "@/controllers/notifications.controller";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(notificationsController.list));

export default router;
