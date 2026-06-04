import bcrypt from "bcryptjs";
import { Role, type User } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  deleteFile,
  PUBLIC_BUCKET,
  tryExtractKeyFromPublicUrl,
} from "@/lib/storage";
import type { SafeUser } from "@/services/auth.service";

function toSafeUser(user: User): SafeUser {
  const { password: _p, ...rest } = user;
  return rest;
}

async function deleteStoredUrlIfOwned(
  userId: string,
  oldUrl: string | null | undefined,
  folderPrefix: string
): Promise<void> {
  if (!oldUrl) {
    return;
  }
  const key = tryExtractKeyFromPublicUrl(oldUrl);
  if (!key || !key.includes(`/${folderPrefix}/${userId}/`)) {
    return;
  }
  await deleteFile(PUBLIC_BUCKET, key);
}

export async function getAdminProfile(adminId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user || user.role !== Role.ADMIN) {
    throw new NotFoundError("Profile");
  }
  return toSafeUser(user);
}

export async function updateAdminProfile(
  adminId: string,
  data: { name?: string; image?: string }
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { id: adminId } });
  if (!existing || existing.role !== Role.ADMIN) {
    throw new NotFoundError("Profile");
  }

  if (data.image !== undefined && data.image !== existing.image) {
    await deleteStoredUrlIfOwned(adminId, existing.image, "avatars");
  }

  const user = await prisma.user.update({
    where: { id: adminId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
  });
  return toSafeUser(user);
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user || user.role !== Role.ADMIN) {
    throw new NotFoundError("Profile");
  }
  if (!user.password) {
    throw new ValidationError("Password change is not available for this account");
  }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    throw new ValidationError("Current password is incorrect", {
      currentPassword: "Current password is incorrect",
    });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: adminId },
    data: { password: hashed },
  });
}
