import { ReviewStatus, ReviewType, type Prisma, type Review } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyReviewApproved } from "@/services/notification.service";
import { HttpError } from "@/utils/httpError";

const reviewInclude = {
  reviewer: { select: { id: true, name: true, email: true, image: true } },
  reviewee: { select: { id: true, name: true, email: true, image: true } },
  equipment: { select: { id: true, title: true } },
} as const;

export async function listReviews(filters: {
  status?: ReviewStatus;
  type?: ReviewType;
  search?: string;
}): Promise<Review[]> {
  const where: Prisma.ReviewWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { comment: { contains: q, mode: "insensitive" } },
      { reviewer: { name: { contains: q, mode: "insensitive" } } },
      { reviewee: { name: { contains: q, mode: "insensitive" } } },
      { equipment: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  return prisma.review.findMany({
    where,
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function approveReview(id: string, adminId: string): Promise<Review> {
  const existing = await prisma.review.findUnique({
    where: { id },
    include: reviewInclude,
  });
  if (!existing) {
    throw new HttpError(404, "Review not found");
  }
  if (existing.status === ReviewStatus.APPROVED) {
    return existing;
  }

  const row = await prisma.review.update({
    where: { id },
    data: {
      status: ReviewStatus.APPROVED,
      adminNote: null,
      moderatedAt: new Date(),
      moderatedBy: adminId,
    },
    include: reviewInclude,
  });

  void notifyReviewApproved(
    row.revieweeId,
    row.type,
    row.reviewer.name,
    row.type === ReviewType.EQUIPMENT
      ? row.equipment?.title ?? "listing"
      : row.reviewee.name,
    { equipmentId: row.equipmentId, reviewId: row.id }
  ).catch(() => undefined);

  return row;
}

export async function rejectReview(id: string, adminId: string, note?: string): Promise<Review> {
  const trimmed = note?.trim();
  if (!trimmed || trimmed.length < 3) {
    throw new HttpError(400, "Rejection reason is required");
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Review not found");
  }

  return prisma.review.update({
    where: { id },
    data: {
      status: ReviewStatus.REJECTED,
      adminNote: trimmed,
      moderatedAt: new Date(),
      moderatedBy: adminId,
    },
    include: reviewInclude,
  });
}

export async function deleteReview(id: string): Promise<void> {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Review not found");
  }
  await prisma.review.delete({ where: { id } });
}
