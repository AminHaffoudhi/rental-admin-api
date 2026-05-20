import type { Booking, Delivery, User } from "@prisma/client";
import { sendMail } from "@/lib/mailer";
import logger from "@/lib/logger";
import { formatCurrency } from "@/utils/currency";

export function baseTemplate(content: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
             background: #fafaf9; margin: 0; padding: 0; }
      .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px; }
      .card { background: #fff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; }
      .header { background: #f97316; padding: 32px 40px; text-align: center; }
      .header h1 { color: white; font-size: 22px; margin: 0; font-family: Georgia, serif; }
      .body { padding: 40px; }
      .btn { display: inline-block; background: #f97316; color: white !important;
             padding: 14px 32px; border-radius: 10px; text-decoration: none;
             font-weight: 600; font-size: 15px; margin: 16px 0; }
      .footer { padding: 24px 40px; background: #fafaf9; border-top: 1px solid #f5f5f4;
                text-align: center; color: #a8a29e; font-size: 12px; }
      p { color: #44403c; line-height: 1.7; margin: 0 0 16px; }
      .warning { background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px;
                 padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header"><h1>● RentMarket</h1></div>
        <div class="body">${content}</div>
        <div class="footer">© 2026 RentMarket · Tunisia</div>
      </div>
    </div>
  </body>
  </html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const clientBase = () => (process.env.CLIENT_URL ?? "").replace(/\/+$/, "");

export type SendEmailMeta = Record<string, unknown>;

export function logNonCriticalEmailFailure(
  type: string,
  err: unknown,
  extra?: Record<string, unknown>
): void {
  logger.warn("Email notification failed (non-critical)", {
    type,
    error: err instanceof Error ? err.message : String(err),
    ...extra,
  });
}

export async function sendKycApprovedEmail(to: string, name: string): Promise<void> {
  const base = clientBase();
  await sendMail({
    to,
    subject: "Your account is verified — you can now list equipment",
    html: baseTemplate(`
      <p>Hi <strong>${esc(name)}</strong>,</p>
      <p>Great news! Your identity has been <strong style="color:#16a34a">verified</strong>.</p>
      <p>You can now list your equipment on RentMarket and start earning.</p>
      <a href="${base}/equipment/new" class="btn">Create Your First Listing →</a>
    `),
  });
}

export async function sendKycRejectedEmail(
  to: string,
  name: string,
  reason: string
): Promise<void> {
  const base = clientBase();
  await sendMail({
    to,
    subject: "Action required — Identity verification issue",
    html: baseTemplate(`
      <p>Hi <strong>${esc(name)}</strong>,</p>
      <p>We were unable to verify your identity document.</p>
      <div class="warning"><strong>Reason:</strong> ${esc(reason)}</div>
      <p style="margin-top:16px">Please re-upload a clear, valid document:</p>
      <a href="${base}/profile" class="btn">Re-upload Document →</a>
    `),
  });
}

export async function sendDeliveryScheduledEmail(
  renter: Pick<User, "email" | "name">,
  delivery: Pick<Delivery, "deliverySlot" | "returnSlot">,
  booking: Pick<Booking, "id">
): Promise<void> {
  await sendMail({
    to: renter.email,
    subject: `Delivery scheduled for booking ${booking.id}`,
    html: baseTemplate(`
      <p>Hi <strong>${esc(renter.name)}</strong>,</p>
      <p>Delivery details were updated.</p>
      <p>${delivery.deliverySlot ? `Pickup slot: ${delivery.deliverySlot.toISOString()}` : ""}</p>
      <p>${delivery.returnSlot ? `Return slot: ${delivery.returnSlot.toISOString()}` : ""}</p>
    `),
  });
}

export async function sendPayoutSentEmail(
  owner: Pick<User, "email" | "name">,
  amount: number,
  equipmentTitle: string,
  bookingId: string
): Promise<void> {
  const base = clientBase();
  await sendMail({
    to: owner.email,
    subject: `Payout sent — ${amount} TND`,
    html: baseTemplate(`
      <p>Hi <strong>${esc(owner.name)}</strong>,</p>
      <p>Your payout of <strong>${amount} TND</strong> for <strong>${esc(equipmentTitle)}</strong> has been processed.</p>
      <a href="${base}/dashboard/earnings" class="btn">View Earnings →</a>
    `),
  });
}

export async function sendDisputeResolvedEmail(
  owner: Pick<User, "email" | "name">,
  renter: Pick<User, "email" | "name">,
  booking: Pick<Booking, "id">,
  resolution: string
): Promise<void> {
  const body = `<p>A dispute on booking <strong>${booking.id}</strong> was resolved.</p>
    <p>Resolution: ${esc(resolution)}</p>`;
  await sendMail({
    to: owner.email,
    subject: `Dispute resolved — booking ${booking.id}`,
    html: baseTemplate(`<p>Hi <strong>${esc(owner.name)}</strong>,</p>${body}`),
  });
  await sendMail({
    to: renter.email,
    subject: `Dispute resolved — booking ${booking.id}`,
    html: baseTemplate(`<p>Hi <strong>${esc(renter.name)}</strong>,</p>${body}`),
  });
}

export async function sendRefundNotificationEmail(
  renter: Pick<User, "email" | "name">,
  booking: Pick<Booking, "id" | "totalPrice">
): Promise<void> {
  await sendMail({
    to: renter.email,
    subject: `Refund processed — booking ${booking.id}`,
    html: baseTemplate(`
      <p>Hi <strong>${esc(renter.name)}</strong>,</p>
      <p>A refund related to booking <strong>${booking.id}</strong> has been processed.</p>
      <p>Total booking amount reference: ${formatCurrency(booking.totalPrice)}</p>
    `),
  });
}
