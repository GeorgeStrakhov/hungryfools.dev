"use server";

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function toggleAdminStatus(
  userId: string,
  newAdminStatus: boolean,
) {
  // Check if current user is admin
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Don't allow users to remove their own admin status
  if (session.user.id === userId && !newAdminStatus) {
    throw new Error("Cannot remove your own admin status");
  }

  await db
    .update(users)
    .set({ isAdmin: newAdminStatus })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");

  return { success: true };
}

export async function deleteUser(userId: string) {
  // Check if current user is admin
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Don't allow users to delete their own account from admin panel
  if (session.user.id === userId) {
    throw new Error("Cannot delete your own account from the admin panel");
  }

  // Use the same deletion logic as self-service deletion
  // This will cascade delete profiles, projects, accounts, etc.
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/users");

  return { success: true };
}
