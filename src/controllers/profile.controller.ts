import type { Request, Response } from "express";
import { UnauthorizedError } from "@/lib/errors";
import * as profileService from "@/services/profile.service";
import { success } from "@/utils/apiResponse";

export async function getMe(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new UnauthorizedError();
  }
  const profile = await profileService.getAdminProfile(adminId);
  success(res, profile);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new UnauthorizedError();
  }
  const body = req.body as { name?: string; image?: string };
  const profile = await profileService.updateAdminProfile(adminId, body);
  success(res, profile);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new UnauthorizedError();
  }
  const body = req.body as {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  await profileService.changeAdminPassword(adminId, body.currentPassword, body.newPassword);
  success(res, { message: "Password updated successfully" });
}
