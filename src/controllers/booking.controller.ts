import type { Request, Response } from "express";
import * as bookingService from "@/services/booking.service";
import { success } from "@/utils/apiResponse";
import { optionalString, parseBookingStatus } from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const bookings = await bookingService.getAllBookings({
    status: parseBookingStatus(req.query.status),
    renterId: optionalString(req.query.renterId),
    ownerId: optionalString(req.query.ownerId),
  });
  success(res, bookings);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.getBookingById(req.params.id as string);
  success(res, booking);
}

export async function confirmPayment(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.id;
  const booking = await bookingService.confirmPayment(req.params.id as string, adminId);
  success(res, booking);
}

export async function forceComplete(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.forceComplete(req.params.id as string);
  success(res, booking);
}

export async function forceCancel(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.forceCancel(req.params.id as string);
  success(res, booking);
}
