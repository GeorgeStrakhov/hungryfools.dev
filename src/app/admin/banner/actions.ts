"use server";

import { db } from "@/db";
import { banners } from "@/db/schema/banner";
import { requireAdmin } from "../admin-check";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createBanner(data: {
  headline: string;
  message: string;
  authOnly: boolean;
  isActive: boolean;
}) {
  await requireAdmin();

  // If activating this banner, deactivate all others first
  if (data.isActive) {
    await db
      .update(banners)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(banners.isActive, true));
  }

  // Always create a new banner (new ID means users will see it even if they dismissed a previous one)
  await db.insert(banners).values({
    headline: data.headline,
    message: data.message,
    authOnly: data.authOnly,
    isActive: data.isActive,
  });

  revalidatePath("/admin/banner");
  revalidatePath("/"); // Revalidate homepage to show/hide banner
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  await requireAdmin();

  // If activating, deactivate all others first
  if (isActive) {
    await db
      .update(banners)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(banners.isActive, true));
  }

  await db
    .update(banners)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(banners.id, bannerId));

  revalidatePath("/admin/banner");
  revalidatePath("/");
}

export async function deleteBanner(bannerId: string) {
  await requireAdmin();

  await db.delete(banners).where(eq(banners.id, bannerId));

  revalidatePath("/admin/banner");
  revalidatePath("/");
}
