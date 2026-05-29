import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { deleteFile, PUBLIC_BUCKET } from "@/lib/storage";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await prisma.equipmentCategory.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function listCategories(includeInactive = true) {
  return prisma.equipmentCategory.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { equipment: true } } },
  });
}

export async function getCategoryById(id: string) {
  const row = await prisma.equipmentCategory.findUnique({
    where: { id },
    include: { _count: { select: { equipment: true } } },
  });
  if (!row) throw new NotFoundError("Category");
  return row;
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  iconKey?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const baseSlug = data.slug?.trim() || slugify(data.name);
  if (!baseSlug) {
    throw new ValidationError("Could not generate a valid slug from name");
  }
  const slug = await ensureUniqueSlug(baseSlug);

  return prisma.equipmentCategory.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description?.trim() ?? "",
      iconUrl: data.iconUrl ?? "",
      iconKey: data.iconKey ?? "",
      color: data.color ?? "bg-stone-50 text-stone-600",
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    iconUrl: string;
    iconKey: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const existing = await getCategoryById(id);

  let slug = existing.slug;
  if (data.slug !== undefined) {
    slug = await ensureUniqueSlug(data.slug.trim(), id);
  } else if (data.name !== undefined && data.name.trim() !== existing.name) {
    slug = await ensureUniqueSlug(slugify(data.name), id);
  }

  if (data.iconKey !== undefined && existing.iconKey && data.iconKey !== existing.iconKey) {
    await deleteFile(PUBLIC_BUCKET, existing.iconKey).catch(() => undefined);
  }

  return prisma.equipmentCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      slug,
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.iconUrl !== undefined ? { iconUrl: data.iconUrl } : {}),
      ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteCategory(id: string) {
  const existing = await getCategoryById(id);
  if (existing._count.equipment > 0) {
    throw new ConflictError("Cannot delete a category that has equipment listings");
  }
  if (existing.iconKey) {
    await deleteFile(PUBLIC_BUCKET, existing.iconKey).catch(() => undefined);
  }
  await prisma.equipmentCategory.delete({ where: { id } });
}
