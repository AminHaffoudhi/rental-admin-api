import { DeliveryStatus } from "@prisma/client";
import { z } from "zod";

export const assignAgentSchema = z.object({
  agentName: z.string().min(1),
  agentPhone: z.string().min(1),
  deliverySlot: z.string().min(1),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(DeliveryStatus),
});
