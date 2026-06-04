import { z } from "zod";

export const updateAdminProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
