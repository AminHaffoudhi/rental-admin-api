import type { Request, Response } from "express";
import * as equipmentService from "@/services/equipment.service";
import { success } from "@/utils/apiResponse";
import { optionalString, parseCategory } from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const equipment = await equipmentService.getAllEquipment({
    category: parseCategory(req.query.category),
    search: optionalString(req.query.search),
    ownerId: optionalString(req.query.ownerId),
  });
  success(res, equipment);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await equipmentService.deleteEquipment(req.params.id as string);
  success(res, null);
}
