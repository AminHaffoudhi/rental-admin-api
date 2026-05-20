import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { HttpError } from "@/utils/httpError";
import {
  logNonCriticalEmailFailure,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
} from "@/services/email.service";
import { notifyKycApproved, notifyKycRejected } from "@/services/notification.service";

export async function approveKyc(userId: string, adminId: string) {
  const doc = await prisma.kycDocument.findUnique({ where: { userId } });
  if (!doc) {
    throw new HttpError(404, "No KYC document submitted for this user");
  }

  await prisma.$transaction([
    prisma.kycDocument.update({
      where: { userId },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "APPROVED", canList: true },
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    void sendKycApprovedEmail(user.email, user.name).catch((err) =>
      logNonCriticalEmailFailure("kyc_approved", err, { userId })
    );
    logger.info("Sending KYC approval notification to owner", { userId });
    void notifyKycApproved(userId).catch((err) =>
      logger.warn("Failed to send KYC approved notification", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { kycDocument: true },
  });
}

export async function rejectKyc(userId: string, adminId: string, reason: string) {
  const doc = await prisma.kycDocument.findUnique({ where: { userId } });
  if (!doc) {
    throw new HttpError(404, "No KYC document submitted for this user");
  }

  await prisma.$transaction([
    prisma.kycDocument.update({
      where: { userId },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: reason,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "REJECTED", canList: false },
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    void sendKycRejectedEmail(user.email, user.name, reason).catch((err) =>
      logNonCriticalEmailFailure("kyc_rejected", err, { userId })
    );
    logger.info("Sending KYC rejection notification to owner", { userId, reason });
    void notifyKycRejected(userId, reason).catch((err) =>
      logger.warn("Failed to send KYC rejected notification", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { kycDocument: true },
  });
}
