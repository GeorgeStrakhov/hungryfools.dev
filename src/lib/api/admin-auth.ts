import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export type AdminAuthResult =
  | {
      isValid: false;
      response: NextResponse;
    }
  | {
      isValid: true;
      userId: string;
    };

/**
 * Middleware to check if the current user is authenticated and is an admin
 * @returns Either an error response or the validated user ID
 */
export async function requireAdminAuth(): Promise<AdminAuthResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        isValid: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // Check if user is admin
    const [user] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user?.isAdmin) {
      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        ),
      };
    }

    return {
      isValid: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return {
      isValid: false,
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 },
      ),
    };
  }
}

/**
 * Wrapper function for admin API route handlers
 * Automatically handles authentication and authorization
 */
export function withAdminAuth<T extends unknown[], R>(
  handler: (userId: string, ...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R | NextResponse> => {
    const authResult = await requireAdminAuth();

    if (!authResult.isValid) {
      return authResult.response as R;
    }

    return handler(authResult.userId, ...args);
  };
}
