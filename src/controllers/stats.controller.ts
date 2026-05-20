import type { Request, Response } from "express";
import * as statsService from "@/services/stats.service";
import { success } from "@/utils/apiResponse";

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await statsService.getStats();
  success(res, stats);
}
