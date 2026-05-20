import {
  BookingStatus,
  DisputeStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import {
  logNonCriticalEmailFailure,
  sendDisputeResolvedEmail,
  sendRefundNotificationEmail,
} from "@/services/email.service";

export async function getAllDisputes(filters: { status?: DisputeStatus }) {
  const where: Prisma.DisputeWhereInput = {};
  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  return prisma.dispute.findMany({
    where,
    include: {
      booking: {
        include: {
          equipment: true,
          renter: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      raisedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDisputeById(id: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          equipment: true,
          renter: true,
          owner: true,
          payment: true,
        },
      },
      raisedBy: true,
    },
  });
  if (!dispute) {
    throw new HttpError(404, "Dispute not found");
  }
  return dispute;
}

export async function resolveDispute(
  disputeId: string,
  input: { resolution: string; outcome: "RESOLVED_OWNER" | "RESOLVED_RENTER" }
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          owner: true,
          renter: true,
        },
      },
    },
  });
  if (!dispute) {
    throw new HttpError(404, "Dispute not found");
  }
  if (dispute.status !== DisputeStatus.OPEN) {
    throw new HttpError(400, "Dispute is not open");
  }

  const status =
    input.outcome === "RESOLVED_OWNER"
      ? DisputeStatus.RESOLVED_OWNER
      : DisputeStatus.RESOLVED_RENTER;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution: input.resolution,
        resolvedAt: new Date(),
      },
    });

    if (input.outcome === "RESOLVED_OWNER") {
      await tx.booking.update({
        where: { id: dispute.bookingId },
        data: { status: BookingStatus.COMPLETED },
      });
      if (dispute.booking.payment?.status === PaymentStatus.CONFIRMED) {
        await tx.payment.update({
          where: { bookingId: dispute.bookingId },
          data: { status: PaymentStatus.PAYOUT_PENDING },
        });
      }
    } else {
      await tx.booking.update({
        where: { id: dispute.bookingId },
        data: { status: BookingStatus.REFUNDED },
      });
    }

    return tx.dispute.findUniqueOrThrow({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            equipment: true,
            renter: true,
            owner: true,
            payment: true,
          },
        },
        raisedBy: true,
      },
    });
  });

  void sendDisputeResolvedEmail(
    updated.booking.owner,
    updated.booking.renter,
    updated.booking,
    input.resolution
  ).catch((err) =>
    logNonCriticalEmailFailure("dispute_resolved", err, { bookingId: updated.bookingId })
  );

  if (input.outcome === "RESOLVED_RENTER") {
    void sendRefundNotificationEmail(updated.booking.renter, updated.booking).catch((err) =>
      logNonCriticalEmailFailure("refund_notification", err, { bookingId: updated.bookingId })
    );
  }

  return updated;
}
