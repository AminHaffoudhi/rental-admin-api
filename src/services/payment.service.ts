import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import { sendPayoutSentEmail, logNonCriticalEmailFailure } from "@/services/email.service";

export async function getAllPayments(filters: { status?: PaymentStatus }) {
  const where: Prisma.PaymentWhereInput = {};
  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  return prisma.payment.findMany({
    where,
    include: {
      booking: {
        include: {
          equipment: true,
          renter: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaymentById(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          equipment: true,
          renter: true,
          owner: true,
        },
      },
    },
  });
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }
  return payment;
}

/** Owner receives rental proceeds minus platform fee (deposit handled separately in models). */
function ownerPayoutAmount(booking: { totalPrice: number; platformFee: number }): number {
  return booking.totalPrice - booking.platformFee;
}

export async function sendPayout(paymentId: string, _adminId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          owner: true,
          equipment: true,
        },
      },
    },
  });
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }
  if (payment.booking.status !== BookingStatus.COMPLETED) {
    throw new HttpError(400, "Booking must be completed before payout");
  }
  if (payment.status !== PaymentStatus.PAYOUT_PENDING) {
    throw new HttpError(400, "Payment is not pending payout");
  }

  const amount = ownerPayoutAmount(payment.booking);

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.PAYOUT_SENT,
      payoutSentAt: new Date(),
    },
    include: {
      booking: {
        include: {
          owner: true,
          equipment: true,
        },
      },
    },
  });

  void sendPayoutSentEmail(
    updated.booking.owner,
    amount,
    updated.booking.equipment.title,
    updated.booking.id
  ).catch((err) =>
    logNonCriticalEmailFailure("payout_sent", err, { bookingId: updated.bookingId })
  );

  return updated;
}
