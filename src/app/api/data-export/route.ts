import { NextResponse } from "next/server";
import { requireUserAuth } from "@/lib/api/user-auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const authResult = await requireUserAuth();

    if (!authResult.isValid) {
      return authResult.response;
    }

    const userId = authResult.userId;

    // Fetch user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Fetch profile data
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    // Fetch account connections (OAuth providers)
    const userAccounts = await db
      .select({
        type: accounts.type,
        provider: accounts.provider,
        providerAccountId: accounts.providerAccountId,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.id, // Using ID as proxy for creation time
      },
      profile: profile
        ? {
            handle: profile.handle,
            displayName: profile.displayName,
            headline: profile.headline,
            bio: profile.bio,
            skills: profile.skills,
            interests: profile.interests,
            location: profile.location,
            links: profile.links,
            availability: profile.availability,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      accounts: userAccounts,
    };

    const response = NextResponse.json(exportData);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="user-data-${userId}.json"`,
    );

    return response;
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
