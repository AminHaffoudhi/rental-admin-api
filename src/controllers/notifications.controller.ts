import type { Request, Response } from "express";
import {
  DisputeStatus,
  EquipmentApprovalStatus,
  KycStatus,
  ReviewStatus,
  PaymentStatus,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { success } from "@/utils/apiResponse";

export interface AdminNotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  timestamp: Date;
  read: boolean;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newUsers, kycPending, openDisputes, pendingPayments, pendingEquipment, pendingReviews] =
    await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: [Role.RENTER, Role.OWNER, Role.BOTH] },
        createdAt: { gte: weekAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { kycStatus: KycStatus.SUBMITTED },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, updatedAt: true },
    }),
    prisma.dispute.findMany({
      where: { status: DisputeStatus.OPEN },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, bookingId: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.PAYOUT_PENDING },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, bookingId: true, createdAt: true },
    }),
    prisma.equipment.findMany({
      where: { approvalStatus: EquipmentApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        createdAt: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.review.findMany({
      where: { status: ReviewStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        createdAt: true,
        reviewer: { select: { name: true } },
        reviewee: { select: { name: true } },
        equipment: { select: { title: true } },
      },
    }),
  ]);

  const notifications: AdminNotificationDto[] = [
    ...newUsers.map((u) => ({
      id: `user-${u.id}`,
      type: "new_user",
      title: "👤 New user registered",
      body: `${u.name} (${u.email}) joined as ${u.role.toLowerCase()}`,
      url: "/users",
      timestamp: u.createdAt,
      read: false,
    })),
    ...kycPending.map((u) => ({
      id: `kyc-${u.id}`,
      type: "kyc_submitted",
      title: "🪪 Pending KYC review",
      body: `${u.name} (${u.email}) submitted their identity document`,
      url: "/users?tab=kyc",
      timestamp: u.updatedAt,
      read: false,
    })),
    ...openDisputes.map((d) => ({
      id: `dispute-${d.id}`,
      type: "dispute_opened",
      title: "⚠️ Open dispute",
      body: `Booking ${d.bookingId.slice(0, 8)} has an unresolved dispute`,
      url: "/disputes",
      timestamp: d.createdAt,
      read: false,
    })),
    ...pendingPayments.map((p) => ({
      id: `payout-${p.id}`,
      type: "payment_received",
      title: "💰 Payout pending",
      body: `Booking ${p.bookingId.slice(0, 8)} is awaiting payout`,
      url: "/payments",
      timestamp: p.createdAt,
      read: false,
    })),
    ...pendingEquipment.map((e) => ({
      id: `equipment-pending-${e.id}`,
      type: "equipment_pending",
      title: "📦 New listing pending approval",
      body: `${e.owner.name} submitted "${e.title}" for review`,
      url: `/equipment?highlight=${e.id}`,
      timestamp: e.createdAt,
      read: false,
    })),
    ...pendingReviews.map((r) => ({
      id: `review-pending-${r.id}`,
      type: "review_pending",
      title: "⭐ New review to moderate",
      body:
        r.type === "EQUIPMENT"
          ? `${r.reviewer.name} reviewed "${r.equipment?.title ?? "listing"}" (${r.reviewee.name})`
          : `${r.reviewer.name} reviewed owner ${r.reviewee.name}`,
      url: `/reviews?highlight=${r.id}`,
      timestamp: r.createdAt,
      read: false,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  success(res, notifications);
}
