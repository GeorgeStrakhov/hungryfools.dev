import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type UserAuthResult =
  | {
      isValid: false;
      response: NextResponse;
    }
  | {
      isValid: true;
      userId: string;
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        isAdmin?: boolean;
      };
    };

/**
 * Check if the current user is authenticated
 * @returns Either an error response or the validated user data
 */
export async function requireUserAuth(): Promise<UserAuthResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        ),
      };
    }

    return {
      isValid: true,
      userId: session.user.id,
      user: session.user,
    };
  } catch (error) {
    console.error("User auth error:", error);
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
 * Wrapper function for authenticated API route handlers
 */
export function withUserAuth<T extends unknown[], R>(
  handler: (
    userId: string,
    user: Extract<UserAuthResult, { isValid: true }>["user"],
    ...args: T
  ) => Promise<R>,
) {
  return async (...args: T): Promise<R | NextResponse> => {
    const authResult = await requireUserAuth();

    if (!authResult.isValid) {
      return authResult.response as R;
    }

    return handler(authResult.userId, authResult.user, ...args);
  };
}
