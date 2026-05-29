import {
  BookingStatus,
  DeliveryStatus,
  DisputeStatus,
  KycStatus,
  PaymentStatus,
  Role,
} from "@prisma/client";
import { HttpError } from "@/utils/httpError";

function optionalEnum<E extends string>(
  raw: unknown,
  enumObject: Record<string, E>,
  label: string
): E | undefined {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string") {
    throw new HttpError(400, `Invalid query parameter: ${label}`);
  }
  const values = Object.values(enumObject);
  if (!values.includes(raw as E)) {
    throw new HttpError(400, `Invalid query parameter: ${label}`);
  }
  return raw as E;
}

export function parseRole(raw: unknown): Role | undefined {
  return optionalEnum(raw, Role as Record<string, Role>, "role");
}

export function parseKycStatus(raw: unknown): KycStatus | undefined {
  return optionalEnum(raw, KycStatus as Record<string, KycStatus>, "kycStatus");
}

export function parseBookingStatus(raw: unknown): BookingStatus | undefined {
  return optionalEnum(raw, BookingStatus as Record<string, BookingStatus>, "status");
}

export function parseDeliveryStatus(raw: unknown): DeliveryStatus | undefined {
  return optionalEnum(raw, DeliveryStatus as Record<string, DeliveryStatus>, "status");
}

export function parsePaymentStatus(raw: unknown): PaymentStatus | undefined {
  return optionalEnum(raw, PaymentStatus as Record<string, PaymentStatus>, "status");
}

export function parseDisputeStatus(raw: unknown): DisputeStatus | undefined {
  return optionalEnum(raw, DisputeStatus as Record<string, DisputeStatus>, "status");
}

export function optionalString(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string") {
    throw new HttpError(400, "Invalid query parameter: search");
  }
  return raw;
}
