import type { Request, Response } from "express";
import { ReviewStatus, ReviewType } from "@prisma/client";
import * as reviewService from "@/services/review.service";
import { success } from "@/utils/apiResponse";
import { optionalString } from "@/utils/queryParse";

function parseStatus(raw: unknown): ReviewStatus | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim().toUpperCase();
  if (v === "PENDING" || v === "APPROVED" || v === "REJECTED") {
    return v as ReviewStatus;
  }
  return undefined;
}

function parseType(raw: unknown): ReviewType | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim().toUpperCase();
  if (v === "OWNER" || v === "EQUIPMENT") {
    return v as ReviewType;
  }
  return undefined;
}

export async function list(req: Request, res: Response): Promise<void> {
  const reviews = await reviewService.listReviews({
    status: parseStatus(req.query.status),
    type: parseType(req.query.type),
    search: optionalString(req.query.search),
  });
  success(res, reviews);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const item = await reviewService.approveReview(
    req.params.id as string,
    req.user!.id
  );
  success(res, item);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const note = req.body.note as string;
  const item = await reviewService.rejectReview(
    req.params.id as string,
    req.user!.id,
    note
  );
  success(res, item);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await reviewService.deleteReview(req.params.id as string);
  success(res, null);
}
