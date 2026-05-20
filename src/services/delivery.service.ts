import { BookingStatus, DeliveryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";
import { sendDeliveryScheduledEmail, logNonCriticalEmailFailure } from "@/services/email.service";

export async function getAllDeliveries(filters: { status?: DeliveryStatus }) {
  const where: Prisma.DeliveryWhereInput = {};
  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  return prisma.delivery.findMany({
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
    orderBy: { updatedAt: "desc" },
  });
}

export async function assignAgent(
  deliveryId: string,
  data: { agentName: string; agentPhone: string; deliverySlot: string }
) {
  const slot = new Date(data.deliverySlot);
  if (Number.isNaN(slot.getTime())) {
    throw new HttpError(400, "Invalid delivery slot date");
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      booking: {
        include: {
          renter: true,
          equipment: true,
          owner: true,
        },
      },
    },
  });
  if (!delivery) {
    throw new HttpError(404, "Delivery not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        agentName: data.agentName,
        agentPhone: data.agentPhone,
        deliverySlot: slot,
      },
    });

    await tx.booking.update({
      where: { id: delivery.bookingId },
      data: { status: BookingStatus.PICKUP_SCHEDULED },
    });

    return tx.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
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
  });

  void sendDeliveryScheduledEmail(
    updated.booking.renter,
    updated,
    updated.booking
  ).catch((err) =>
    logNonCriticalEmailFailure("delivery_scheduled", err, { bookingId: updated.bookingId })
  );

  return updated;
}

function bookingStatusForDeliveryStatus(status: DeliveryStatus): BookingStatus | null {
  switch (status) {
    case DeliveryStatus.PICKED_UP:
      return BookingStatus.IN_TRANSIT;
    case DeliveryStatus.DELIVERED:
      return BookingStatus.ACTIVE;
    case DeliveryStatus.RETURN_PICKED_UP:
      return BookingStatus.RETURNING;
    case DeliveryStatus.RETURNED:
      return BookingStatus.INSPECTING;
    default:
      return null;
  }
}

export async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { booking: true },
  });
  if (!delivery) {
    throw new HttpError(404, "Delivery not found");
  }

  const nextBookingStatus = bookingStatusForDeliveryStatus(status);

  return prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: { status },
    });

    if (nextBookingStatus !== null) {
      await tx.booking.update({
        where: { id: delivery.bookingId },
        data: { status: nextBookingStatus },
      });
    }

    return tx.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: {
        booking: {
          include: {
            equipment: true,
            renter: true,
            owner: true,
            payment: true,
          },
        },
      },
    });
  });
}
