import { UPLOAD_MAX_IMAGE_MB } from "@/config/env";
import { ValidationError } from "@/lib/errors";
import {
  ALLOWED_IMAGE_TYPES,
  generateFileKey,
  getPublicUrl,
  putObjectBuffer,
  PUBLIC_BUCKET,
  validateFileSize,
  validateFileType,
  type UploadFolder,
} from "@/lib/storage";

export interface AdminUploadRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  folder: UploadFolder;
  userId: string;
}

export async function uploadDirect(
  buffer: Buffer,
  req: AdminUploadRequest
): Promise<{ url: string; fileKey: string; bucket: string }> {
  const { fileName, contentType, fileSize, folder, userId } = req;

  if (!validateFileType(contentType, ALLOWED_IMAGE_TYPES)) {
    throw new ValidationError(`File type not allowed. Accepted: ${ALLOWED_IMAGE_TYPES.join(", ")}`);
  }
  if (!validateFileSize(fileSize, UPLOAD_MAX_IMAGE_MB)) {
    throw new ValidationError(`File too large. Maximum size: ${UPLOAD_MAX_IMAGE_MB} MB`);
  }

  const fileKey = generateFileKey(folder, userId, fileName);
  const result = await putObjectBuffer(PUBLIC_BUCKET, fileKey, buffer, contentType);
  return {
    url: result.secure_url || getPublicUrl(fileKey),
    fileKey,
    bucket: PUBLIC_BUCKET,
  };
}
