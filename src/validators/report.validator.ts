import { z } from "zod";

export const updateReportStatusSchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
});

export const updateReportNoteSchema = z.object({
  adminNote: z.string().max(5000).optional().nullable(),
});
