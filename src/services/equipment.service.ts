import type { Category, Equipment, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";

export async function getAllEquipment(filters: {
  category?: Category;
  search?: string;
  ownerId?: string;
}): Promise<Equipment[]> {
  const where: Prisma.EquipmentWhereInput = {};
  if (filters.category !== undefined) {
    where.category = filters.category;
  }
  if (filters.ownerId !== undefined) {
    where.ownerId = filters.ownerId;
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
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
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
