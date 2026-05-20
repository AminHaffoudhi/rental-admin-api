import { z } from "zod";

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(1),
  outcome: z.enum(["RESOLVED_OWNER", "RESOLVED_RENTER"]),
});
