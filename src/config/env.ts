import "dotenv/config";

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

export const STORAGE_ENDPOINT = requireNonEmpty(
  "MINIO_ENDPOINT or S3_ENDPOINT",
  process.env.MINIO_ENDPOINT?.trim() || process.env.S3_ENDPOINT?.trim()
);

export const STORAGE_REGION = (
  process.env.MINIO_REGION?.trim() || process.env.S3_REGION?.trim() || "us-east-1"
).trim();

export const STORAGE_ACCESS_KEY = requireNonEmpty(
  "MINIO_ACCESS_KEY, S3_ACCESS_KEY, or MINIO_ROOT_USER",
  process.env.MINIO_ACCESS_KEY?.trim() ||
    process.env.S3_ACCESS_KEY?.trim() ||
    process.env.MINIO_ROOT_USER?.trim()
);

export const STORAGE_SECRET_KEY = requireNonEmpty(
  "MINIO_SECRET_KEY, S3_SECRET_KEY, or MINIO_ROOT_PASSWORD",
  process.env.MINIO_SECRET_KEY?.trim() ||
    process.env.S3_SECRET_KEY?.trim() ||
    process.env.MINIO_ROOT_PASSWORD?.trim()
);

export const STORAGE_PUBLIC_BUCKET = (
  process.env.MINIO_PUBLIC_BUCKET?.trim() || process.env.S3_BUCKET?.trim() || "rentmarket-public"
).trim();

export const STORAGE_PRIVATE_BUCKET = (
  process.env.MINIO_PRIVATE_BUCKET?.trim() || "rentmarket-private"
).trim();

export const STORAGE_PUBLIC_BASE_URL = (
  process.env.MINIO_PUBLIC_URL?.trim() ||
  process.env.S3_PUBLIC_BASE_URL?.trim() ||
  `${STORAGE_ENDPOINT.replace(/\/+$/, "")}/${STORAGE_PUBLIC_BUCKET}`
).replace(/\/+$/, "");

export const UPLOAD_MAX_IMAGE_MB = Number(process.env.UPLOAD_MAX_IMAGE_MB) || 10;

/** Rental web app URL (links in emails to renters/owners). */
export const CLIENT_URL = (
  process.env.CLIENT_URL?.trim() || "http://localhost:5174"
).replace(/\/+$/, "");

/** Local Redis (ioredis). Defaults: 127.0.0.1:6379 */
export const REDIS_HOST = process.env.REDIS_HOST?.trim() || "127.0.0.1";
export const REDIS_PORT = process.env.REDIS_PORT?.trim() || "6379";
