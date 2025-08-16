#!/usr/bin/env tsx
/**
 * Clean up all test users and their data
 * Run with: npx tsx scripts/cleanup-test-users.ts
 */

import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  profiles,
  projects,
  profileEmbeddings,
  projectEmbeddings,
  embeddingLogs,
} from "@/db/schema/profile";
import { eq, like } from "drizzle-orm";

async function main() {
  console.log("🧹 Starting cleanup of test users...\n");

  try {
    // Find all test users (emails starting with test42)
    const testUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(like(users.email, "test42%"));

    if (testUsers.length === 0) {
      console.log("✅ No test users found to clean up.");
      return;
    }

    console.log(`Found ${testUsers.length} test users to delete:`);
    testUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    console.log("");

    let deletedCounts = {
      embeddingLogs: 0,
      projectEmbeddings: 0,
      profileEmbeddings: 0,
      projects: 0,
      profiles: 0,
      users: 0,
    };

    // Delete in correct order (respecting foreign key constraints)
    for (const user of testUsers) {
      console.log(`🗑️  Deleting user: ${user.name}...`);

      // 1. Delete embedding logs for this user's entities
      const userProfiles = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.userId, user.id));
      const userProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.userId, user.id));

      for (const profile of userProfiles) {
        const logs = await db
          .delete(embeddingLogs)
          .where(eq(embeddingLogs.entityId, profile.userId))
          .returning();
        deletedCounts.embeddingLogs += logs.length;
      }

      for (const project of userProjects) {
        const logs = await db
          .delete(embeddingLogs)
          .where(eq(embeddingLogs.entityId, project.id))
          .returning();
        deletedCounts.embeddingLogs += logs.length;
      }

      // 2. Delete project embeddings (CASCADE should handle this, but let's be explicit)
      const projectEmbeddingsDeleted = await db
        .delete(projectEmbeddings)
        .where(eq(projectEmbeddings.userId, user.id))
        .returning();
      deletedCounts.projectEmbeddings += projectEmbeddingsDeleted.length;

      // 3. Delete profile embeddings
      const profileEmbeddingsDeleted = await db
        .delete(profileEmbeddings)
        .where(eq(profileEmbeddings.userId, user.id))
        .returning();
      deletedCounts.profileEmbeddings += profileEmbeddingsDeleted.length;

      // 4. Delete projects (CASCADE from user deletion should handle this, but let's be explicit)
      const projectsDeleted = await db
        .delete(projects)
        .where(eq(projects.userId, user.id))
        .returning();
      deletedCounts.projects += projectsDeleted.length;

      // 5. Delete profiles (CASCADE from user deletion should handle this, but let's be explicit)
      const profilesDeleted = await db
        .delete(profiles)
        .where(eq(profiles.userId, user.id))
        .returning();
      deletedCounts.profiles += profilesDeleted.length;

      // 6. Delete user (this should CASCADE to everything else, but we've been explicit above)
      const usersDeleted = await db
        .delete(users)
        .where(eq(users.id, user.id))
        .returning();
      deletedCounts.users += usersDeleted.length;

      console.log(`      ✅ Deleted user and all associated data`);
    }

    console.log("\n📊 Cleanup Summary:");
    console.log(`   Users: ${deletedCounts.users}`);
    console.log(`   Profiles: ${deletedCounts.profiles}`);
    console.log(`   Projects: ${deletedCounts.projects}`);
    console.log(`   Profile embeddings: ${deletedCounts.profileEmbeddings}`);
    console.log(`   Project embeddings: ${deletedCounts.projectEmbeddings}`);
    console.log(`   Embedding logs: ${deletedCounts.embeddingLogs}`);

    console.log("\n✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
