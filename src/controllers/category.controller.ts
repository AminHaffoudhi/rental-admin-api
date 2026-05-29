import type { Request, Response } from "express";
import * as categoryService from "@/services/category.service";
import { created, success } from "@/utils/apiResponse";

export async function list(req: Request, res: Response): Promise<void> {
  const includeInactive = req.query.includeInactive !== "false";
  const items = await categoryService.listCategories(includeInactive);
  success(res, items);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const item = await categoryService.getCategoryById(req.params.id as string);
  success(res, item);
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await categoryService.createCategory(req.body);
  created(res, item);
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await categoryService.updateCategory(req.params.id as string, req.body);
  success(res, item);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await categoryService.deleteCategory(req.params.id as string);
  success(res, { ok: true });
}
