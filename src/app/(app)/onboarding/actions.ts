"use server";

import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeAndModerate } from "@/lib/moderation/normalize";
import slugify from "slugify";

const vibeInput = z.object({
  vibes: z.array(z.string()).optional(),
  oneLine: z.string().optional(),
});
const vibeOutput = z.object({
  headline: z.string().max(140).optional(),
  vibeTags: z.array(z.string()).max(10).optional(),
});

const stackInput = z.object({
  stack: z.array(z.string()).optional(),
  power: z.string().optional(),
});
const stackOutput = z.object({ stack: z.array(z.string()).max(50).optional() });

const expertiseInput = z.object({ expertise: z.array(z.string()).optional() });
const expertiseOutput = z.object({
  expertiseOther: z.array(z.string()).max(50).optional(),
});

const showcaseInput = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  summary: z.string().optional(),
});
const showcaseOutput = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  oneliner: z.string().optional(),
  description: z.string().optional(),
});

async function upsert(values: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [existing] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const now = new Date();

  if (existing) {
    // Safe update of only provided fields
    await db
      .update(profiles)
      .set({ ...values, updatedAt: now })
      .where(eq(profiles.userId, session.user.id));
    return;
  }

  // First insert requires a non-null handle; derive if not provided
  let handle: string | undefined = values.handle as string | undefined;
  if (!handle) {
    const displayName = session.user.name || "";
    const emailLocal =
      (session.user as { email?: string }).email?.split("@")[0] || "";
    if (
      displayName &&
      slugify(displayName, { lower: true, strict: true, trim: true })
    )
      handle = slugify(displayName, { lower: true, strict: true, trim: true });
    else if (emailLocal)
      handle = slugify(emailLocal, { lower: true, strict: true, trim: true });
    else handle = `user-${session.user.id.slice(0, 8)}`;
  }

  await db.insert(profiles).values({
    userId: session.user.id,
    handle,
    displayName: session.user.name || handle,
    ...values,
    createdAt: now,
    updatedAt: now,
  });
}

export async function saveVibeAction(payload: unknown) {
  const out = await normalizeAndModerate(
    payload,
    vibeInput,
    vibeOutput,
    `
You are a helpful assistant that normalizes a developer's vibe into a short headline and tags.
- Keep headline punchy (<= 100 chars) and non-cringe.
- Use lowercase kebab-case for tags (e.g., agent-wrangler).
`,
  );
  await upsert({ headline: out.headline /* store tags later */ });
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
  await upsert({ skills: out.stack });
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
  await upsert({ interests: out.expertiseOther });
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

  await db.insert(projects).values({
    userId: session.user.id,
    slug: projectSlug,
    name: out.name || "My Project",
    url: out.url || null,
    oneliner: out.oneliner || null,
    description: out.description || null,
    media: [],
    featured: true, // First project is featured by default
    createdAt: now,
    updatedAt: now,
  });
}
