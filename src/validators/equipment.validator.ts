import { z } from "zod";

export const rejectEquipmentSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, "Rejection reason is required (at least 3 characters)")
    .max(500),
});
