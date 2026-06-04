import type { Request, Response } from "express";
import * as reportService from "@/services/report.service";
import { success } from "@/utils/apiResponse";
import {
  optionalString,
  parsePositiveInt,
  parseReportStatus,
  parseReportType,
} from "@/utils/queryParse";

export async function list(req: Request, res: Response): Promise<void> {
  const result = await reportService.listReports({
    status: parseReportStatus(req.query.status),
    type: parseReportType(req.query.type),
    search: optionalString(req.query.search),
    page: parsePositiveInt(req.query.page, "page"),
    limit: parsePositiveInt(req.query.limit, "limit"),
  });
  success(res, result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const report = await reportService.getReportById(req.params.id as string);
  success(res, report);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const body = req.body as { status: "NEW" | "READ" | "ARCHIVED" };
  const adminId = req.user!.id;
  const report = await reportService.updateReportStatus(
    req.params.id as string,
    body.status,
    adminId
  );
  success(res, report);
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  const body = req.body as { adminNote?: string | null };
  const report = await reportService.updateReportNote(
    req.params.id as string,
    body.adminNote ?? null
  );
  success(res, report);
}
