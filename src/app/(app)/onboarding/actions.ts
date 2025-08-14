"use server";

import { db } from "@/db";
import { projects, type ProjectMedia } from "@/db/schema/profile";
import { auth } from "@/auth";
import { z } from "zod";
import { normalizeAndModerate } from "@/lib/moderation/normalize";
import { createOrUpdateProfileAction } from "@/app/(app)/profile/edit/profile.actions";
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
  oneliner: z.string().optional(),
  description: z.string().optional(),
});

export async function saveVibeAction(payload: unknown) {
  const out = await normalizeAndModerate(
    payload,
    vibeInput,
    vibeOutput,
    `
You are a helpful assistant that normalizes a developer's vibe into a short headline and tags.
- Keep headline punchy (<= ${PROFILE_FIELD_LIMITS.headline.max} chars) and non-cringe.
- Use lowercase kebab-case for tags (e.g., agent-wrangler).
`,
  );
  // TODO: Store vibeTags when we add them to the profile schema
  await createOrUpdateProfileAction({ headline: out.headline });
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
- url: Ensure URLs are valid if provided 
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
    oneliner: out.oneliner || null,
    description: out.description || null,
    media,
    featured: true, // First project is featured by default
    createdAt: now,
    updatedAt: now,
  });
}
