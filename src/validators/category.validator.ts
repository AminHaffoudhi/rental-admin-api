import { z } from "zod";

const colorSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[\w\s\-:/.]+$/, "Use Tailwind utility classes for color");

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(500).optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
  iconKey: z.string().max(500).optional(),
  color: colorSchema.optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
