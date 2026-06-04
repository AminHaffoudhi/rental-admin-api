import dotenv from "dotenv";

dotenv.config({ override: true });

function requireNonEmpty(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const DATABASE_URL = requireNonEmpty("DATABASE_URL", process.env.DATABASE_URL);
export const JWT_SECRET = requireNonEmpty("JWT_SECRET", process.env.JWT_SECRET);
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

const portRaw = requireNonEmpty("PORT", process.env.PORT ?? "4001");
const parsedPort = Number.parseInt(portRaw, 10);
if (Number.isNaN(parsedPort)) {
  throw new Error("PORT must be a valid number");
}
export const PORT = parsedPort;

export const ADMIN_CLIENT_URL = requireNonEmpty("ADMIN_CLIENT_URL", process.env.ADMIN_CLIENT_URL);

export const CLOUDINARY_CLOUD_NAME = requireNonEmpty(
  "CLOUDINARY_CLOUD_NAME",
  process.env.CLOUDINARY_CLOUD_NAME
);

export const CLOUDINARY_API_KEY = requireNonEmpty(
  "CLOUDINARY_API_KEY",
  process.env.CLOUDINARY_API_KEY
);

export const CLOUDINARY_API_SECRET = requireNonEmpty(
  "CLOUDINARY_API_SECRET",
  process.env.CLOUDINARY_API_SECRET
);

export const CLOUDINARY_FOLDER = (process.env.CLOUDINARY_FOLDER?.trim() || "ekri").replace(
  /\/+$/,
  ""
);

export const UPLOAD_MAX_IMAGE_MB = Number(process.env.UPLOAD_MAX_IMAGE_MB) || 10;

/** Rental web app URL (links in emails to renters/owners). */
export const CLIENT_URL = (
  process.env.CLIENT_URL?.trim() || "http://localhost:5174"
).replace(/\/+$/, "");

/** Local Redis (ioredis). Defaults: 127.0.0.1:6379 */
export const REDIS_HOST = process.env.REDIS_HOST?.trim() || "127.0.0.1";
export const REDIS_PORT = process.env.REDIS_PORT?.trim() || "6379";
