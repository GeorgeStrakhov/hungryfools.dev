import { db } from "@/db";
import { banners } from "@/db/schema/banner";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { BannerDialog } from "./banner-dialog";

export async function BannerAlert() {
  // Get the active banner
  const [activeBanner] = await db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .limit(1);

  // If no active banner, return nothing
  if (!activeBanner) {
    return null;
  }

  // Check if banner is for auth users only
  if (activeBanner.authOnly) {
    const session = await auth();
    if (!session?.user) {
      return null; // Don't show banner to unauthenticated users
    }
  }

  return (
    <BannerDialog
      bannerId={activeBanner.id}
      headline={activeBanner.headline}
      message={activeBanner.message}
    />
  );
}
