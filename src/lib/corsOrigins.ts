import { ADMIN_CLIENT_URL, CLIENT_URL } from "@/config/env";

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function buildAllowedOrigins(): string[] {
  const fromEnv = [
    ADMIN_CLIENT_URL,
    CLIENT_URL,
    ...(process.env.CORS_ORIGINS ?? "").split(","),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return Array.from(new Set(fromEnv));
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  if (buildAllowedOrigins().includes(normalized)) {
    return true;
  }
  if (process.env.NODE_ENV !== "production" && LOCALHOST_ORIGIN.test(normalized)) {
    return true;
  }
  return false;
}
