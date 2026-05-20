import { z } from "zod";
import { Role } from "@prisma/client";

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const kycActionSchema = z.object({
  action: z.literal("REJECTED"),
  note: z.string().min(1, "Reason for rejection is required"),
});
