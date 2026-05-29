import type { Request, Response } from "express";
import { EquipmentApprovalStatus } from "@prisma/client";
import * as equipmentService from "@/services/equipment.service";
import { success } from "@/utils/apiResponse";
import { optionalString } from "@/utils/queryParse";

function parseApprovalStatus(raw: unknown): EquipmentApprovalStatus | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim().toUpperCase();
  if (v === "PENDING" || v === "APPROVED" || v === "REJECTED") {
    return v as EquipmentApprovalStatus;
  }
  return undefined;
}

export async function list(req: Request, res: Response): Promise<void> {
  const equipment = await equipmentService.getAllEquipment({
    categoryId: optionalString(req.query.categoryId) ?? optionalString(req.query.category),
    search: optionalString(req.query.search),
    ownerId: optionalString(req.query.ownerId),
    approvalStatus: parseApprovalStatus(req.query.status ?? req.query.approvalStatus),
  });
  success(res, equipment);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const item = await equipmentService.approveEquipment(req.params.id as string);
  success(res, item);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const note = req.body.note as string;
  const item = await equipmentService.rejectEquipment(req.params.id as string, note);
  success(res, item);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await equipmentService.deleteEquipment(req.params.id as string);
  success(res, null);
}
