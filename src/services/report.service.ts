import { Prisma, SupportReportStatus, SupportReportType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/httpError";

export type ReportListFilters = {
  status?: SupportReportStatus;
  type?: SupportReportType;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listReports(filters: ReportListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: Prisma.SupportReportWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total, newCount] = await Promise.all([
    prisma.supportReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.supportReport.count({ where }),
    prisma.supportReport.count({ where: { status: SupportReportStatus.NEW } }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    newCount,
  };
}

export async function getReportById(id: string) {
  const report = await prisma.supportReport.findUnique({ where: { id } });
  if (!report) {
    throw new HttpError(404, "Report not found");
  }
  return report;
}

export async function updateReportStatus(
  id: string,
  status: SupportReportStatus,
  adminId: string
) {
  const existing = await prisma.supportReport.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Report not found");
  }

  const now = new Date();
  const data: Prisma.SupportReportUpdateInput = { status };

  if (status === SupportReportStatus.READ && existing.status === SupportReportStatus.NEW) {
    data.readAt = now;
    data.readById = adminId;
  }
  if (status === SupportReportStatus.ARCHIVED) {
    data.archivedAt = now;
    if (!existing.readAt) {
      data.readAt = now;
      data.readById = adminId;
    }
  }
  if (status === SupportReportStatus.NEW) {
    data.readAt = null;
    data.readById = null;
    data.archivedAt = null;
  }

  return prisma.supportReport.update({ where: { id }, data });
}

export async function updateReportNote(id: string, adminNote: string | null) {
  const existing = await prisma.supportReport.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Report not found");
  }
  return prisma.supportReport.update({
    where: { id },
    data: { adminNote: adminNote?.trim() || null },
  });
}
