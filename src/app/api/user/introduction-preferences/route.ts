import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAuth } from "@/lib/api/user-auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

const updatePreferencesSchema = z.object({
  allowIntroductions: z.boolean(),
});

export async function GET() {
  try {
    const authResult = await requireUserAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }
    const { userId } = authResult;

    const [user] = await db
      .select({
        allowIntroductions: users.allowIntroductions,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      allowIntroductions: user.allowIntroductions,
    });
  } catch (error) {
    console.error("Failed to get introduction preferences:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireUserAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }
    const { userId } = authResult;

    const body = await request.json();
    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { allowIntroductions } = validation.data;

    await db
      .update(users)
      .set({
        allowIntroductions,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      message: "Introduction preferences updated successfully",
      allowIntroductions,
    });
  } catch (error) {
    console.error("Failed to update introduction preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
