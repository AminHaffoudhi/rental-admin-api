import { Readable } from "node:stream";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { CLOUDINARY_FOLDER } from "@/config/env";
import { ExternalServiceError } from "@/lib/errors";
import { cloudinary } from "@/lib/cloudinary";
import logger from "@/lib/logger";

export const PUBLIC_BUCKET = "cloudinary";
export const PRIVATE_BUCKET = "cloudinary-authenticated";

export type UploadFolder = "equipment" | "avatars" | "covers" | "kyc" | "delivery" | "categories";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function deliveryType(folder: UploadFolder): "authenticated" | "upload" {
  return folder === "kyc" ? "authenticated" : "upload";
}

function prefixPublicId(folder: UploadFolder, userId: string, originalName: string): string {
  const ext = path.extname(originalName).replace(/^\./, "").toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
  const base = CLOUDINARY_FOLDER ? `${CLOUDINARY_FOLDER}/` : "";
  return `${base}${folder}/${userId}/${randomUUID()}.${safeExt}`;
}

export function generateFileKey(folder: UploadFolder, userId: string, originalName: string): string {
  return prefixPublicId(folder, userId, originalName);
}

export function validateFileType(contentType: string, allowed: string[]): boolean {
  return allowed.includes(contentType.toLowerCase());
}

export function validateFileSize(sizeBytes: number, maxMB: number): boolean {
  return sizeBytes <= maxMB * 1024 * 1024;
}

export function toStorageError(err: unknown, action: string): ExternalServiceError {
  const message = err instanceof Error ? err.message : String(err);
  return new ExternalServiceError(
    "Cloudinary",
    `Storage error while ${action}: ${message}`,
    err instanceof Error ? err : undefined
  );
}

function uploadBuffer(
  buffer: Buffer,
  publicId: string,
  folder: UploadFolder
): Promise<UploadApiResponse> {
  const type = deliveryType(folder);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        type,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

function folderFromPublicId(publicId: string): UploadFolder {
  const parts = publicId.split("/");
  const idx = CLOUDINARY_FOLDER ? 1 : 0;
  const segment = parts[idx];
  const allowed: UploadFolder[] = [
    "equipment",
    "avatars",
    "covers",
    "kyc",
    "delivery",
    "categories",
  ];
  return allowed.includes(segment as UploadFolder) ? (segment as UploadFolder) : "categories";
}

export async function putObjectBuffer(
  _bucket: string,
  fileKey: string,
  body: Buffer,
  _contentType: string
): Promise<UploadApiResponse> {
  try {
    return await uploadBuffer(body, fileKey, folderFromPublicId(fileKey));
  } catch (err) {
    throw toStorageError(err, "uploading file");
  }
}

export function getPublicUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "auto",
    type: "upload",
  });
}

export async function deleteFile(_bucket: string, fileKey: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(fileKey, {
      resource_type: "auto",
      type: "upload",
      invalidate: true,
    });
    logger.debug("Cloudinary asset deleted", { publicId: fileKey });
  } catch (err) {
    logger.warn("Failed to delete Cloudinary asset", {
      publicId: fileKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function tryExtractKeyFromPublicUrl(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) {
    return null;
  }
  const match = url.match(/\/upload\/(?:[^/]+\/)*(?:v\d+\/)?([^?]+)/);
  if (!match?.[1]) {
    return null;
  }
  return decodeURIComponent(match[1]);
}
