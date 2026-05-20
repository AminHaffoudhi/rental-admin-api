import { z } from "zod";

/** Booking id comes from route params on POST /api/bookings/:id/confirm-payment */
export const confirmPaymentSchema = z.object({});

/** Payment id comes from route params on POST /api/payments/:id/payout */
export const sendPayoutSchema = z.object({});
