import { BookingStatus, DeliveryStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import { logNonCriticalEmailFailure, sendDeliveryScheduledEmail } from "@/services/email.service";

const bookingListInclude = {
  equipment: true,
  renter: { select: { id: true, name: true, email: true } },
  owner: { select: { id: true, name: true, email: true } },
  payment: true,
  delivery: true,
} satisfies Prisma.BookingInclude;

export async function getAllBookings(filters: {
  status?: BookingStatus;
  renterId?: string;
  ownerId?: string;
}) {
  const where: Prisma.BookingWhereInput = {};
  if (filters.status !== undefined) {
    where.status = filters.status;
  }
  if (filters.renterId !== undefined) {
    where.renterId = filters.renterId;
  }
  if (filters.ownerId !== undefined) {
    where.ownerId = filters.ownerId;
  }

  return prisma.booking.findMany({
    where,
    include: bookingListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      equipment: true,
      renter: true,
      owner: true,
      payment: true,
      delivery: true,
      dispute: true,
      reviews: true,
    },
  });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  return booking;
}

export async function confirmPayment(bookingId: string, adminId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      delivery: true,
      renter: true,
      equipment: true,
    },
  });
  if (!booking || !booking.payment) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.status !== BookingStatus.PAYMENT_PENDING) {
    throw new HttpError(400, "Booking is not awaiting payment confirmation");
  }
  if (booking.payment.status !== PaymentStatus.PENDING) {
    throw new HttpError(400, "Payment is not pending");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: adminId,
      },
    });

    const existingDelivery = await tx.delivery.findUnique({ where: { bookingId } });
    if (!existingDelivery) {
      await tx.delivery.create({
        data: {
          bookingId,
          status: DeliveryStatus.SCHEDULED,
          pickupPhotos: [],
          returnPhotos: [],
        },
      });
    }

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAID },
      include: {
        equipment: true,
        renter: true,
        owner: true,
        payment: true,
        delivery: true,
      },
    });
  });

  if (updated.delivery) {
    void sendDeliveryScheduledEmail(updated.renter, updated.delivery, updated).catch((err) =>
      logNonCriticalEmailFailure("delivery_scheduled", err, { bookingId: updated.id })
    );
  }

  return updated;
}

export async function forceComplete(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    if (booking.payment && booking.payment.status === PaymentStatus.CONFIRMED) {
      await tx.payment.update({
        where: { bookingId },
        data: { status: PaymentStatus.PAYOUT_PENDING },
      });
    }

    const full = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        equipment: true,
        renter: true,
        owner: true,
        payment: true,
        delivery: true,
      },
    });
    return full;
  });
}

export async function forceCancel(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
    include: {
      equipment: true,
      renter: true,
      owner: true,
      payment: true,
      delivery: true,
    },
  });
}
