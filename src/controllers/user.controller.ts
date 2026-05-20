import type { Request, Response } from "express";
import * as userService from "@/services/user.service";
import { success } from "@/utils/apiResponse";
import { HttpError } from "@/utils/httpError";
import {
  optionalString,
  parseKycStatus,
  parseRole,
} from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const users = await userService.getAllUsers({
    role: parseRole(req.query.role),
    kycStatus: parseKycStatus(req.query.kycStatus),
    search: optionalString(req.query.search),
  });
  success(res, users);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id as string);
  success(res, user);
}

export async function approveKyc(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new HttpError(401, "Unauthorized");
  }
  const user = await userService.approveKyc(req.params.id as string, adminId);
  success(res, user);
}

export async function rejectKyc(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new HttpError(401, "Unauthorized");
  }
  const body = req.body as { action: "REJECTED"; note: string };
  if (body.action !== "REJECTED") {
    throw new HttpError(400, "Invalid action for reject endpoint");
  }
  const user = await userService.rejectKyc(req.params.id as string, adminId, body.note);
  success(res, user);
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const body = req.body as { role: import("@prisma/client").Role };
  const user = await userService.updateUserRole(req.params.id as string, body.role);
  success(res, user);
}
