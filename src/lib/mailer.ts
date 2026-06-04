import nodemailer from "nodemailer";
import { PLATFORM_NAME } from "@/config/brand";
import logger from "@/lib/logger";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth:
    user && pass
      ? {
          user,
          pass,
        }
      : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

void transporter.verify().then(() => {
  logger.info("Gmail SMTP connected", { user: process.env.SMTP_USER });
}).catch((err: unknown) => {
  logger.warn("Gmail SMTP connection failed — emails will not send", {
    error: err instanceof Error ? err.message : String(err),
  });
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    logger.info("[DEV] Sending email", { to: options.to, subject: options.subject });
  }
  const fromUser = process.env.SMTP_USER?.trim();
  if (!fromUser) {
    const msg = "SMTP_USER is not set — cannot send email";
    logger.error(msg, { to: options.to });
    throw new Error(msg);
  }
  const info = await transporter.sendMail({
    from: `"${PLATFORM_NAME} Admin" <${fromUser}>`,
    ...options,
  });
  logger.info("Email sent", { messageId: info.messageId, to: options.to });
}
