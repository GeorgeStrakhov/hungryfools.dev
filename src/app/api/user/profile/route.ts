import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select({ profileImage: profiles.profileImage })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json({
      profileImage: profile?.profileImage || null,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
