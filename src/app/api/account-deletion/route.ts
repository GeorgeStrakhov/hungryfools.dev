import { NextResponse } from "next/server";
import { requireUserAuth } from "@/lib/api/user-auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export async function DELETE() {
  try {
    const authResult = await requireUserAuth();

    if (!authResult.isValid) {
      return authResult.response;
    }

    const userId = authResult.userId;

    // Delete in proper order due to foreign key constraints
    // Profile deletion will cascade due to onDelete: "cascade"
    // Accounts and sessions will cascade due to onDelete: "cascade"
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
