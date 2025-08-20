import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AnalyticsIdentifier } from "./analytics-identifier";

export default async function PostAuthRouter() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const [existing] = await db
    .select({ userId: profiles.userId, completed: users.onboardingCompleted })
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  // Pass redirect destination to the client component
  const redirectTo =
    existing && existing.completed ? "/directory" : "/onboarding/purpose";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Signing you in...</p>
        <AnalyticsIdentifier redirectTo={redirectTo} />
      </div>
    </div>
  );
}
