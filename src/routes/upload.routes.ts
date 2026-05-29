import { Router } from "express";
import express from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as uploadController from "@/controllers/upload.controller";

const router = Router();
const rawParser = express.raw({ type: "*/*", limit: "15mb" });

router.post("/direct", rawParser, asyncHandler(uploadController.directUpload));

export default router;
