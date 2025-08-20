"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects, profiles } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { validateFields } from "@/lib/moderation/server";
import {
  onProjectChange,
  onProjectDelete,
} from "@/lib/services/embeddings/lifecycle";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  slug: z.string().min(1, "Project slug is required").max(50),
  url: z.string().url().optional().or(z.literal("")),
  githubUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true; // Empty is okay
        try {
          const url = new URL(val);
          return (
            url.hostname === "github.com" || url.hostname === "www.github.com"
          );
        } catch {
          return false;
        }
      },
      { message: "GitHub URL must be a valid GitHub repository URL" },
    ),
  oneliner: z.string().max(140).optional(),
  description: z.string().max(2000).optional(),
  featured: z.boolean(),
  media: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["image", "video"]),
      filename: z.string(),
      size: z.number(),
      key: z.string(),
    }),
  ),
});

export async function createProject(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedData = projectSchema.parse(data);

  // Validate content for inappropriate material (batch validation)
  const fieldsToValidate = [];

  if (validatedData.name?.trim()) {
    fieldsToValidate.push({
      text: validatedData.name.trim(),
      context: "project-name",
      maxLength: 100,
    });
  }
  if (validatedData.oneliner?.trim()) {
    fieldsToValidate.push({
      text: validatedData.oneliner.trim(),
      context: "project-oneliner",
      maxLength: 140,
    });
  }
  if (validatedData.description?.trim()) {
    fieldsToValidate.push({
      text: validatedData.description.trim(),
      context: "project-description",
      maxLength: 2000,
    });
  }

  // Single API call for all fields
  await validateFields(fieldsToValidate);

  // Check if slug is unique for this user
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, session.user.id),
        eq(projects.slug, validatedData.slug),
      ),
    )
    .limit(1);

  if (existingProject) {
    throw new Error("A project with this slug already exists");
  }

  const now = new Date();

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      slug: validatedData.slug,
      name: validatedData.name,
      url: validatedData.url || null,
      githubUrl: validatedData.githubUrl || null,
      oneliner: validatedData.oneliner || null,
      description: validatedData.description || null,
      media: validatedData.media,
      featured: validatedData.featured,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Trigger embedding generation for the new project
  if (newProject) {
    await onProjectChange(newProject.id, true); // Immediate mode for new projects
    console.log(
      `[Analytics] Project created: ${newProject.name} by user ${session.user.id}`,
    );
  }

  // Get user's handle for redirect
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (profile) {
    revalidatePath(`/u/${profile.handle}`);
    redirect(`/u/${profile.handle}`);
  }

  redirect("/");
}

export async function updateProject(projectId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedData = projectSchema.parse(data);

  // Validate content for inappropriate material (batch validation)
  const fieldsToValidate = [];

  if (validatedData.name?.trim()) {
    fieldsToValidate.push({
      text: validatedData.name.trim(),
      context: "project-name",
      maxLength: 100,
    });
  }
  if (validatedData.oneliner?.trim()) {
    fieldsToValidate.push({
      text: validatedData.oneliner.trim(),
      context: "project-oneliner",
      maxLength: 140,
    });
  }
  if (validatedData.description?.trim()) {
    fieldsToValidate.push({
      text: validatedData.description.trim(),
      context: "project-description",
      maxLength: 2000,
    });
  }

  // Single API call for all fields
  await validateFields(fieldsToValidate);

  // Verify project ownership
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
    )
    .limit(1);

  if (!existingProject) {
    throw new Error("Project not found or unauthorized");
  }

  // Check if slug is unique for this user (excluding current project)
  if (validatedData.slug !== existingProject.slug) {
    const [slugConflict] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, session.user.id),
          eq(projects.slug, validatedData.slug),
        ),
      )
      .limit(1);

    if (slugConflict) {
      throw new Error("A project with this slug already exists");
    }
  }

  await db
    .update(projects)
    .set({
      slug: validatedData.slug,
      name: validatedData.name,
      url: validatedData.url || null,
      githubUrl: validatedData.githubUrl || null,
      oneliner: validatedData.oneliner || null,
      description: validatedData.description || null,
      media: validatedData.media,
      featured: validatedData.featured,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  // Trigger embedding update for the project
  await onProjectChange(projectId, false); // Queued mode for updates
  console.log(
    `[Analytics] Project updated: ${validatedData.name} by user ${session.user.id}`,
  );

  // Get user's handle for redirect
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (profile) {
    revalidatePath(`/u/${profile.handle}`);
    revalidatePath(`/u/${profile.handle}/p/${validatedData.slug}`);
    redirect(`/u/${profile.handle}`);
  }

  redirect("/");
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify project ownership
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
    )
    .limit(1);

  if (!existingProject) {
    throw new Error("Project not found or unauthorized");
  }

  // TODO: Delete media files from S3
  // if (existingProject.media && existingProject.media.length > 0) {
  //   for (const mediaItem of existingProject.media) {
  //     await deleteFromS3(mediaItem.key);
  //   }
  // }

  await db.delete(projects).where(eq(projects.id, projectId));

  // Update profile embedding since project list changed
  await onProjectDelete(session.user.id);

  // Get user's handle for revalidation and redirect
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (profile) {
    revalidatePath(`/u/${profile.handle}`);
    redirect(`/u/${profile.handle}`);
  }

  // Fallback redirect
  redirect("/");
}
