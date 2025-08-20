"use server";

import { db } from "@/db";
import { projects, type ProjectMedia } from "@/db/schema/profile";
import { auth } from "@/auth";
import { z } from "zod";
import { PACDUCK_MESSAGES } from "@/lib/moderation/shared";
import { createOrUpdateProfileAction } from "@/components/profile/profile.actions";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-utils";
import { sanitizeText, sanitizeArray } from "@/lib/utils/sanitize";
import { moderateOnboardingFields } from "@/lib/moderation/profile-moderation";
import slugify from "slugify";

const vibeInput = z.object({
  vibes: z.array(z.string()).optional(),
  oneLine: z.string().optional(),
});

const stackInput = z.object({
  stack: z.array(z.string()).optional(),
  power: z.string().optional(),
});

const expertiseInput = z.object({ expertise: z.array(z.string()).optional() });

const showcaseInput = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  githubUrl: z.string().optional(),
  oneliner: z.string().optional(),
  summary: z.string().optional(),
  media: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(["image", "video"]),
        filename: z.string(),
        size: z.number(),
        key: z.string(),
      }),
    )
    .optional(),
});

export async function saveVibeAction(payload: unknown) {
  try {
    const input = vibeInput.parse(payload);

    // Moderate content first using smart moderation
    await moderateOnboardingFields({
      vibeText: input.oneLine,
      vibes: input.vibes,
    });

    const updates: Record<string, unknown> = {};

    // Save user's text directly as headline (preserve their exact words)
    if (input.oneLine?.trim()) {
      updates.headline = sanitizeText(
        input.oneLine,
        PROFILE_FIELD_LIMITS.headline.max,
      );
    }

    // Save vibe selections as lowercase tags (no LLM processing)
    if (input.vibes && input.vibes.length > 0) {
      updates.vibeTags = sanitizeArray(
        input.vibes,
        PROFILE_FIELD_LIMITS.vibeTags.max,
      );
    }

    if (Object.keys(updates).length > 0) {
      await createOrUpdateProfileAction(updates);
    }
  } catch (error: unknown) {
    // If it's a ModerationError, preserve the message for the client
    if (error instanceof Error && error.name === "ModerationError") {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function saveStackAction(payload: unknown) {
  try {
    const input = stackInput.parse(payload);

    // Moderate content first using smart moderation
    await moderateOnboardingFields({
      stackText: input.power,
      stack: input.stack,
    });

    // Save stack selections directly (no LLM processing)
    const skills = sanitizeArray(
      input.stack || [],
      PROFILE_FIELD_LIMITS.skills.max,
    );

    await createOrUpdateProfileAction({
      skills: skills.join(", "),
    });
  } catch (error: unknown) {
    // If it's a ModerationError, preserve the message for the client
    if (error instanceof Error && error.name === "ModerationError") {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function saveExpertiseAction(payload: unknown) {
  try {
    const input = expertiseInput.parse(payload);

    // Moderate content first using smart moderation
    await moderateOnboardingFields({
      expertise: input.expertise,
    });

    // Save expertise selections directly (no LLM processing)
    const interests = sanitizeArray(
      input.expertise || [],
      PROFILE_FIELD_LIMITS.interests.max,
    );

    await createOrUpdateProfileAction({
      interests: interests.join(", "),
    });
  } catch (error: unknown) {
    // If it's a ModerationError, preserve the message for the client
    if (error instanceof Error && error.name === "ModerationError") {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function saveShowcaseAction(payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = showcaseInput.parse(payload);

  // Moderate project content using the existing smart moderation (like projects.ts)
  const fieldsToValidate = [];
  if (input.title?.trim()) {
    fieldsToValidate.push({
      text: input.title.trim(),
      context: "project-name",
      maxLength: 100,
    });
  }
  if (input.oneliner?.trim()) {
    fieldsToValidate.push({
      text: input.oneliner.trim(),
      context: "project-oneliner",
      maxLength: 200,
    });
  }
  if (input.summary?.trim()) {
    fieldsToValidate.push({
      text: input.summary.trim(),
      context: "project-description",
      maxLength: 1000,
    });
  }

  // Use the same moderation as projects
  if (fieldsToValidate.length > 0) {
    const { validateFields } = await import("@/lib/moderation/server");
    await validateFields(fieldsToValidate);
  }

  // Basic sanitization without LLM processing
  const sanitizedProject = {
    name: input.title ? sanitizeText(input.title, 100) : undefined,
    url: input.link?.trim() || undefined,
    githubUrl: input.githubUrl?.trim() || undefined,
    oneliner: input.oneliner ? sanitizeText(input.oneliner, 200) : undefined,
    description: input.summary ? sanitizeText(input.summary, 1000) : undefined,
  };

  // Only create project if we have meaningful content
  if (
    !sanitizedProject.name &&
    !sanitizedProject.oneliner &&
    !sanitizedProject.description
  ) {
    return; // Skip project creation for empty showcase
  }

  // Generate a slug from the project name
  const projectSlug = sanitizedProject.name
    ? slugify(sanitizedProject.name, { lower: true, strict: true, trim: true })
    : `project-${Date.now()}`;

  const now = new Date();

  // Get media from input (already uploaded via API)
  const inputData = payload as { media?: ProjectMedia[] };
  const media = inputData?.media || [];

  await db.insert(projects).values({
    userId: session.user.id,
    slug: projectSlug,
    name: sanitizedProject.name || "My Project",
    url: sanitizedProject.url || null,
    githubUrl: sanitizedProject.githubUrl || null,
    oneliner: sanitizedProject.oneliner || null,
    description: sanitizedProject.description || null,
    media,
    featured: true, // First project is featured by default
    createdAt: now,
    updatedAt: now,
  });
}

// Finalize onboarding: write all fields in one transaction and set onboarding flag
import { users } from "@/db/schema/auth";
// import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

const completeInput = z.object({
  purposes: z.array(z.string()),
  handle: z.string().min(3),
  location: z.string().optional(),
  vibes: z.array(z.string()).optional(),
  vibeText: z.string().optional(),
  stack: z.array(z.string()).optional(),
  stackText: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export async function completeOnboardingAction(payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = completeInput.parse(payload);

  // 1) Persist profile core fields atomically
  const availability = {
    collab: input.purposes.includes("find"),
    hire: input.purposes.includes("get_hired"),
    hiring: input.purposes.includes("hiring"),
  };

  const cleanedLocation = input.location?.trim();

  // Reuse profile upsert but pass explicit fields; let it normalize/validate handle
  await createOrUpdateProfileAction({
    handle: input.handle,
    location: cleanedLocation ? cleanedLocation : undefined,
    displayName: session.user.name || undefined,
    availCollab: availability.collab,
    availHire: availability.hire,
    availHiring: availability.hiring,
    showcase: input.purposes.includes("list"),
    // Raw selections for persistence
    vibeSelections: input.vibes ?? [],
    vibeText: (input.vibeText || "").trim() || undefined,
    stackSelections: input.stack ?? [],
    stackText: (input.stackText || "").trim() || undefined,
    expertiseSelections: input.expertise ?? [],
  });

  // 2) Save additional onboarding data directly (no LLM processing)
  try {
    if ((input.vibes?.length || 0) > 0 || (input.vibeText || "").trim()) {
      await saveVibeAction({
        vibes: input.vibes ?? [],
        oneLine: input.vibeText,
      });
    }

    if ((input.stack?.length || 0) > 0 || (input.stackText || "").trim()) {
      await saveStackAction({
        stack: input.stack ?? [],
        power: input.stackText,
      });
    }

    if ((input.expertise?.length || 0) > 0) {
      await saveExpertiseAction({ expertise: input.expertise ?? [] });
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    const ex: Error & { name: string } = new Error(
      err?.message || PACDUCK_MESSAGES.generic,
    ) as Error & { name: string };
    ex.name = "ModerationError";
    throw ex;
  }

  // 3) Mark onboarding completed
  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.id, session.user.id));

  // 4) Track onboarding completion (server-side analytics will be handled by client)
  console.log(`[Analytics] Onboarding completed for user ${session.user.id}`);
}

// Update onboarding-derived fields from the profile edit page

const editOnboardingInput = z.object({
  purposes: z.array(z.string()).optional(),
  vibes: z.array(z.string()).optional(),
  vibeText: z.string().optional(),
  stack: z.array(z.string()).optional(),
  stackText: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export async function updateOnboardingFromEditAction(payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = editOnboardingInput.parse(payload);

  // Map purposes to availability/showcase if provided
  const availability = input.purposes
    ? {
        collab: input.purposes.includes("find"),
        hire: input.purposes.includes("get_hired"),
        hiring: input.purposes.includes("hiring"),
        showcase: input.purposes.includes("list"),
      }
    : null;

  // Moderate all onboarding content first
  await moderateOnboardingFields({
    vibeText: input.vibeText,
    stackText: input.stackText,
    vibes: input.vibes,
    stack: input.stack,
    expertise: input.expertise,
  });

  // Process selections for derived fields
  const vibeTags =
    input.vibes && input.vibes.length > 0
      ? sanitizeArray(input.vibes, PROFILE_FIELD_LIMITS.vibeTags.max)
      : undefined;

  const skills =
    input.stack && input.stack.length > 0
      ? sanitizeArray(input.stack, PROFILE_FIELD_LIMITS.skills.max).join(", ")
      : undefined;

  const interests =
    input.expertise && input.expertise.length > 0
      ? sanitizeArray(input.expertise, PROFILE_FIELD_LIMITS.interests.max).join(
          ", ",
        )
      : undefined;

  const headline = input.vibeText?.trim()
    ? sanitizeText(input.vibeText, PROFILE_FIELD_LIMITS.headline.max)
    : undefined;

  // Single database update with all fields
  await createOrUpdateProfileAction({
    // Availability flags
    ...(availability
      ? {
          availCollab: availability.collab,
          availHire: availability.hire,
          availHiring: availability.hiring,
          showcase: availability.showcase,
        }
      : {}),
    // Raw selections for storage
    ...(input.vibes ? { vibeSelections: input.vibes } : {}),
    ...(input.vibeText && input.vibeText.trim()
      ? { vibeText: input.vibeText.trim() }
      : {}),
    ...(input.stack ? { stackSelections: input.stack } : {}),
    ...(input.stackText && input.stackText.trim()
      ? { stackText: input.stackText.trim() }
      : {}),
    ...(input.expertise ? { expertiseSelections: input.expertise } : {}),
    // Derived processed fields
    ...(headline ? { headline } : {}),
    ...(vibeTags ? { vibeTags } : {}),
    ...(skills ? { skills } : {}),
    ...(interests ? { interests } : {}),
  });

  return { success: true } as const;
}
