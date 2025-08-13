import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function PostAuthRouter() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const [existing] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (existing) {
    redirect("/directory");
  } else {
    redirect("/onboarding/purpose");
  }
}


