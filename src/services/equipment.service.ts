import { EquipmentApprovalStatus, type Equipment, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  notifyEquipmentApproved,
  notifyEquipmentRejected,
} from "@/services/notification.service";
import { HttpError } from "@/utils/httpError";

const equipmentInclude = {
  category: true,
  owner: { select: { id: true, name: true, email: true } },
} as const;

export async function getAllEquipment(filters: {
  categoryId?: string;
  search?: string;
  ownerId?: string;
  approvalStatus?: EquipmentApprovalStatus;
}): Promise<Equipment[]> {
  const where: Prisma.EquipmentWhereInput = {};
  if (filters.categoryId !== undefined) {
    where.categoryId = filters.categoryId;
  }
  if (filters.ownerId !== undefined) {
    where.ownerId = filters.ownerId;
  }
  if (filters.approvalStatus !== undefined) {
    where.approvalStatus = filters.approvalStatus;
  }
  if (filters.search !== undefined && filters.search.trim() !== "") {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.equipment.findMany({
    where,
    include: equipmentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function approveEquipment(id: string): Promise<Equipment> {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Equipment not found");
  }
  if (existing.approvalStatus === EquipmentApprovalStatus.APPROVED) {
    return prisma.equipment.findUniqueOrThrow({
      where: { id },
      include: equipmentInclude,
    });
  }

  const row = await prisma.equipment.update({
    where: { id },
    data: {
      approvalStatus: EquipmentApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectionNote: null,
    },
    include: equipmentInclude,
  });

  void notifyEquipmentApproved(row.ownerId, row.title, row.id).catch(() => undefined);

  return row;
}

export async function rejectEquipment(id: string, note: string): Promise<Equipment> {
  const trimmed = note.trim();
  if (trimmed.length < 3) {
    throw new HttpError(400, "Rejection reason is required");
  }

  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Equipment not found");
  }

  const row = await prisma.equipment.update({
    where: { id },
    data: {
      approvalStatus: EquipmentApprovalStatus.REJECTED,
      approvedAt: null,
      isAvailable: false,
      rejectionNote: trimmed,
    },
    include: equipmentInclude,
  });

  void notifyEquipmentRejected(row.ownerId, row.title, trimmed, row.id).catch(() => undefined);

  return row;
}

export async function deleteEquipment(id: string): Promise<void> {
  const existing = await prisma.equipment.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!existing) {
    throw new HttpError(404, "Equipment not found");
  }
  if (existing._count.bookings > 0) {
    throw new HttpError(400, "Cannot delete equipment with existing bookings");
  }
  await prisma.equipment.delete({ where: { id } });
}
