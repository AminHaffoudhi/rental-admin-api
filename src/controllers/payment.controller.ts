import type { Request, Response } from "express";
import * as paymentService from "@/services/payment.service";
import { success } from "@/utils/apiResponse";
import { parsePaymentStatus } from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const payments = await paymentService.getAllPayments({
    status: parsePaymentStatus(req.query.status),
  });
  success(res, payments);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.getPaymentById(req.params.id as string);
  success(res, payment);
}

export async function payout(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.id;
  const payment = await paymentService.sendPayout(req.params.id as string, adminId);
  success(res, payment);
}
