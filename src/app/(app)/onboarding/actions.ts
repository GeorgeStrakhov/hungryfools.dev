"use server";

import { db } from "@/db";
import { projects, type ProjectMedia } from "@/db/schema/profile";
import { auth } from "@/auth";
import { z } from "zod";
import { PACDUCK_MESSAGES } from "@/lib/moderation/shared";
import { normalizeAndModerate } from "@/lib/moderation/normalize";
import { createOrUpdateProfileAction } from "@/components/profile/profile.actions";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-utils";
import slugify from "slugify";

const vibeInput = z.object({
  vibes: z.array(z.string()).optional(),
  oneLine: z.string().optional(),
});
const vibeOutput = z.object({
  headline: z.string().max(PROFILE_FIELD_LIMITS.headline.max).optional(),
  vibeTags: z
    .array(z.string())
    .max(PROFILE_FIELD_LIMITS.vibeTags.max)
    .optional(),
});

const stackInput = z.object({
  stack: z.array(z.string()).optional(),
  power: z.string().optional(),
});
const stackOutput = z.object({
  stack: z.array(z.string()).max(PROFILE_FIELD_LIMITS.skills.max).optional(),
});

const expertiseInput = z.object({ expertise: z.array(z.string()).optional() });
const expertiseOutput = z.object({
  expertiseOther: z
    .array(z.string())
    .max(PROFILE_FIELD_LIMITS.interests.max)
    .optional(),
});

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
const showcaseOutput = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  githubUrl: z.string().optional(),
  oneliner: z.string().optional(),
  description: z.string().optional(),
});

export async function saveVibeAction(payload: unknown) {
  const input = vibeInput.parse(payload);

  // If user provided text, use it directly as headline (preserve their exact words)
  if (input.oneLine?.trim()) {
    await createOrUpdateProfileAction({ headline: input.oneLine.trim() });
  }

  // Process vibe selections into standardized tags (if any selected)
  if (input.vibes && input.vibes.length > 0) {
    const out = await normalizeAndModerate(
      { vibes: input.vibes },
      z.object({ vibes: z.array(z.string()) }),
      vibeOutput,
      `
You are a helpful assistant that normalizes developer vibe selections into standardized tags.
- Convert vibe selections into lowercase kebab-case tags (e.g., "Ship-first Vibecoder" → "ship-first-vibecoder").
- Keep tags consistent and searchable.
- Return only the vibeTags array.
`,
    );
    await createOrUpdateProfileAction({ vibeTags: out.vibeTags });
  }
}

export async function saveStackAction(payload: unknown) {
  const out = await normalizeAndModerate(
    payload,
    stackInput,
    stackOutput,
    `
Normalize tech names into canonical short tokens (lowercase), dedupe, sort by relevance.
`,
  );
  await createOrUpdateProfileAction({
    skills: out.stack?.join(", "),
  });
}

export async function saveExpertiseAction(payload: unknown) {
  const out = await normalizeAndModerate(
    payload,
    expertiseInput,
    expertiseOutput,
    `
Normalize non-dev expertise tags (lowercase). Avoid personal identifiers.
`,
  );
  await createOrUpdateProfileAction({
    interests: out.expertiseOther?.join(", "),
  });
}

export async function saveShowcaseAction(payload: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const out = await normalizeAndModerate(
    payload,
    showcaseInput,
    showcaseOutput,
    `
Clean up project info:
- name: Keep project titles crisp and professional
- url: Ensure URLs are valid if provided (regular project URLs, not GitHub)
- githubUrl: Ensure GitHub URLs are valid if provided
- oneliner: Create a punchy one-liner tagline
- description: Expand the summary into a clear description
`,
  );

  // Only create project if we have meaningful content
  if (!out.name && !out.oneliner && !out.description) {
    return; // Skip project creation for empty showcase
  }

  // Generate a slug from the project name
  const projectSlug = out.name
    ? slugify(out.name, { lower: true, strict: true, trim: true })
    : `project-${Date.now()}`;

  const now = new Date();

  // Get media from input (already uploaded via API)
  const inputData = payload as { media?: ProjectMedia[] };
  const media = inputData?.media || [];

  await db.insert(projects).values({
    userId: session.user.id,
    slug: projectSlug,
    name: out.name || "My Project",
    url: out.url || null,
    githubUrl: out.githubUrl || null,
    oneliner: out.oneliner || null,
    description: out.description || null,
    media,
    featured: true, // First project is featured by default
    createdAt: now,
    updatedAt: now,
  });
}

// Finalize onboarding: write all fields in one transaction and set onboarding flag
import { users } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
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

  // 2) Run AI enrichment in parallel where applicable
  const enrichCalls: Promise<unknown>[] = [];
  if ((input.vibes?.length || 0) > 0 || (input.vibeText || "").trim()) {
    enrichCalls.push(
      saveVibeAction({ vibes: input.vibes ?? [], oneLine: input.vibeText })
    );
  }
  if ((input.stack?.length || 0) > 0 || (input.stackText || "").trim()) {
    enrichCalls.push(
      saveStackAction({ stack: input.stack ?? [], power: input.stackText })
    );
  }
  if ((input.expertise?.length || 0) > 0) {
    enrichCalls.push(saveExpertiseAction({ expertise: input.expertise ?? [] }));
  }
  if (enrichCalls.length > 0) {
    try {
      await Promise.all(enrichCalls);
    } catch (e: unknown) {
      const err = e as { message?: string };
      const ex = new Error(err?.message || PACDUCK_MESSAGES.generic);
      (ex as any).name = "ModerationError";
      throw ex;
    }
  }

  // 3) Mark onboarding completed
  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.id, session.user.id));
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

  // Persist raw selections + availability mapping
  await createOrUpdateProfileAction({
    ...(availability
      ? {
          availCollab: availability.collab,
          availHire: availability.hire,
          availHiring: availability.hiring,
          showcase: availability.showcase,
        }
      : {}),
    ...(input.vibes ? { vibeSelections: input.vibes } : {}),
    ...(input.vibeText && input.vibeText.trim()
      ? { vibeText: input.vibeText.trim() }
      : {}),
    ...(input.stack ? { stackSelections: input.stack } : {}),
    ...(input.stackText && input.stackText.trim()
      ? { stackText: input.stackText.trim() }
      : {}),
    ...(input.expertise ? { expertiseSelections: input.expertise } : {}),
  });

  // Enrichment calls
  const enrich: Promise<unknown>[] = [];
  if ((input.vibes && input.vibes.length > 0) || (input.vibeText && input.vibeText.trim())) {
    enrich.push(
      saveVibeAction({ vibes: input.vibes ?? [], oneLine: input.vibeText })
    );
  }
  if ((input.stack && input.stack.length > 0) || (input.stackText && input.stackText.trim())) {
    enrich.push(
      saveStackAction({ stack: input.stack ?? [], power: input.stackText })
    );
  }
  if (input.expertise && input.expertise.length > 0) {
    enrich.push(saveExpertiseAction({ expertise: input.expertise }));
  }
  if (enrich.length > 0) {
    await Promise.all(enrich);
  }

  return { success: true } as const;
}
