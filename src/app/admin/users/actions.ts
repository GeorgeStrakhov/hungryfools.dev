"use server";

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function toggleAdminStatus(userId: string, newAdminStatus: boolean) {
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