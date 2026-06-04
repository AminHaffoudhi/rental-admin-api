import { Role, type KycStatus, type Prisma, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import * as kycAdmin from "@/services/kyc.service";

export async function getAllUsers(filters: {
  role?: Role;
  kycStatus?: KycStatus;
  search?: string;
}): Promise<User[]> {
  const andConditions: Prisma.UserWhereInput[] = [{ role: { not: Role.ADMIN } }];
  if (filters.role !== undefined) {
    andConditions.push({ role: filters.role });
  }

  const where: Prisma.UserWhereInput = { AND: andConditions };
  if (filters.kycStatus !== undefined) {
    where.kycStatus = filters.kycStatus;
  }
  if (filters.search !== undefined && filters.search.trim() !== "") {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.user.findMany({
    where,
    include: { kycDocument: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      kycDocument: true,
      equipment: true,
      bookingsAsRenter: {
        include: { equipment: true, payment: true, delivery: true },
        orderBy: { createdAt: "desc" },
      },
      bookingsAsOwner: {
        include: { equipment: true, payment: true, delivery: true },
        orderBy: { createdAt: "desc" },
      },
      reviewsGiven: true,
      reviewsReceived: true,
    },
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.role === Role.ADMIN) {
    throw new HttpError(404, "User not found");
  }
  return user;
}

export async function approveKyc(userId: string, adminId: string) {
  return kycAdmin.approveKyc(userId, adminId);
}

export async function rejectKyc(userId: string, adminId: string, reason: string) {
  return kycAdmin.rejectKyc(userId, adminId, reason);
}

export async function updateUserRole(userId: string, role: Role): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function blockUser(
  userId: string,
  adminId: string,
  reason?: string
): Promise<User> {
  if (userId === adminId) {
    throw new HttpError(400, "You cannot block your own account");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.role === Role.ADMIN) {
    throw new HttpError(403, "Admin accounts cannot be blocked");
  }
  if (user.blockedAt) {
    return user;
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      blockedAt: new Date(),
      blockedReason: reason?.trim() || null,
    },
    include: { kycDocument: true },
  });
}

export async function unblockUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (!user.blockedAt) {
    return user;
  }
  return prisma.user.update({
    where: { id: userId },
    data: { blockedAt: null, blockedReason: null },
    include: { kycDocument: true },
  });
}
