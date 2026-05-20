import type { Request, Response } from "express";
import * as disputeService from "@/services/dispute.service";
import { success } from "@/utils/apiResponse";
import { parseDisputeStatus } from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const disputes = await disputeService.getAllDisputes({
    status: parseDisputeStatus(req.query.status),
  });
  success(res, disputes);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const dispute = await disputeService.getDisputeById(req.params.id as string);
  success(res, dispute);
}

export async function resolve(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    resolution: string;
    outcome: "RESOLVED_OWNER" | "RESOLVED_RENTER";
  };
  const dispute = await disputeService.resolveDispute(req.params.id as string, body);
  success(res, dispute);
}
