import { Role, type KycStatus, type Prisma, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import * as kycAdmin from "@/services/kyc.service";

export async function getAllUsers(filters: {
  role?: Role;
  kycStatus?: KycStatus;
  search?: string;
}): Promise<User[]> {
  const where: Prisma.UserWhereInput = {};
  if (filters.role !== undefined) {
    where.role = filters.role;
  }
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
