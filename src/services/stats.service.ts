import { BookingStatus, DisputeStatus, KycStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getStats(): Promise<{
  totalUsers: number;
  totalEquipment: number;
  totalBookings: number;
  activeBookings: number;
  pendingKyc: number;
  openDisputes: number;
  totalRevenue: number;
  pendingPayouts: number;
}> {
  const [
    totalUsers,
    totalEquipment,
    totalBookings,
    activeBookings,
    pendingKyc,
    openDisputes,
    revenueAgg,
    pendingPayouts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.equipment.count(),
    prisma.booking.count(),
    prisma.booking.count({
      where: { status: { in: [BookingStatus.IN_TRANSIT, BookingStatus.ACTIVE] } },
    }),
    prisma.user.count({ where: { kycStatus: KycStatus.SUBMITTED } }),
    prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
    prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { platformFee: true },
    }),
    prisma.payment.count({ where: { status: PaymentStatus.PAYOUT_PENDING } }),
  ]);

  return {
    totalUsers,
    totalEquipment,
    totalBookings,
    activeBookings,
    pendingKyc,
    openDisputes,
    totalRevenue: revenueAgg._sum.platformFee ?? 0,
    pendingPayouts,
  };
}
