import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, profiles } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";

type Params = {
  params: Promise<{ handle: string; slug: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { handle, slug } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.handle, handle.toLowerCase()))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, profile.userId), eq(projects.slug, slug)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      project,
      profile: {
        handle: profile.handle,
        userId: profile.userId,
      },
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
