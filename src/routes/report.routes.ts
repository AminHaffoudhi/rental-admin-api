import { Router } from "express";
import * as reportController from "@/controllers/report.controller";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  updateReportNoteSchema,
  updateReportStatusSchema,
} from "@/validators/report.validator";

const router = Router();

router.get("/", asyncHandler(reportController.list));
router.get("/:id", asyncHandler(reportController.getById));
router.patch(
  "/:id/status",
  validate(updateReportStatusSchema),
  asyncHandler(reportController.updateStatus)
);
router.patch(
  "/:id/note",
  validate(updateReportNoteSchema),
  asyncHandler(reportController.updateNote)
);

export default router;
