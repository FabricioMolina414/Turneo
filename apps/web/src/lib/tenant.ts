import { headers } from "next/headers";
import { prisma } from "@/db"; // Adjusted import path, use your actual prisma path

export async function getTenant() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? "";
  const slug = h.get("x-tenant-slug") ?? undefined;
  const surface = (h.get("x-surface") as "public" | "admin" | null) ?? null;

  if (slug) {
    const salon = await prisma.salon.findUnique({ where: { slug } });
    if (!salon) return null;
    return { salon, surface: surface ?? "public" };
  }

  if (host) {
    const salon = await prisma.salon.findFirst({
      where: { OR: [{ publicDomain: host }, { adminDomain: host }] }
    });
    if (!salon) return null;
    const surf: "public" | "admin" = salon.adminDomain === host ? "admin" : "public";
    return { salon, surface: surf };
  }

  return null;
}

