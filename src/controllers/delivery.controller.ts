import type { Request, Response } from "express";
import * as deliveryService from "@/services/delivery.service";
import { success } from "@/utils/apiResponse";
import { parseDeliveryStatus } from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const deliveries = await deliveryService.getAllDeliveries({
    status: parseDeliveryStatus(req.query.status),
  });
  success(res, deliveries);
}

export async function assignAgent(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    agentName: string;
    agentPhone: string;
    deliverySlot: string;
  };
  const delivery = await deliveryService.assignAgent(req.params.id as string, body);
  success(res, delivery);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const body = req.body as { status: import("@prisma/client").DeliveryStatus };
  const delivery = await deliveryService.updateDeliveryStatus(
    req.params.id as string,
    body.status
  );
  success(res, delivery);
}
