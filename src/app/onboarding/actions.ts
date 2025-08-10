"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeAndModerate } from "@/lib/moderation/normalize";

const vibeInput = z.object({
  vibes: z.array(z.string()).optional(),
  oneLine: z.string().optional(),
});
const vibeOutput = z.object({
  headline: z.string().max(140).optional(),
  vibeTags: z.array(z.string()).max(10).optional(),
});

const stackInput = z.object({ stack: z.array(z.string()).optional(), power: z.string().optional() });
const stackOutput = z.object({ stack: z.array(z.string()).max(50).optional() });

const expertiseInput = z.object({ expertise: z.array(z.string()).optional() });
const expertiseOutput = z.object({ expertiseOther: z.array(z.string()).max(50).optional() });

const showcaseInput = z.object({ title: z.string().optional(), link: z.string().optional(), summary: z.string().optional() });
const showcaseOutput = z.object({ title: z.string().optional(), link: z.string().optional(), summaryCompact: z.string().optional() });

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function upsert(values: Record<string, any>) {
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
  let handle: string | undefined = values.handle;
  if (!handle) {
    const displayName = session.user.name || "";
    const emailLocal = (session.user as any).email?.split("@")[0] || "";
    if (displayName && slugify(displayName)) handle = slugify(displayName);
    else if (emailLocal) handle = slugify(emailLocal);
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
  const out = await normalizeAndModerate(payload, vibeInput, vibeOutput, `
You are a helpful assistant that normalizes a developer's vibe into a short headline and tags.
- Keep headline punchy (<= 100 chars) and non-cringe.
- Use lowercase kebab-case for tags (e.g., agent-wrangler).
`);
  await upsert({ headline: out.headline, /* store tags later */ });
}

export async function saveStackAction(payload: unknown) {
  const out = await normalizeAndModerate(payload, stackInput, stackOutput, `
Normalize tech names into canonical short tokens (lowercase), dedupe, sort by relevance.
`);
  await upsert({ skills: out.stack });
}

export async function saveExpertiseAction(payload: unknown) {
  const out = await normalizeAndModerate(payload, expertiseInput, expertiseOutput, `
Normalize non-dev expertise tags (lowercase). Avoid personal identifiers.
`);
  await upsert({ interests: out.expertiseOther });
}

export async function saveShowcaseAction(payload: unknown) {
  const out = await normalizeAndModerate(payload, showcaseInput, showcaseOutput, `
Compress the summary to a crisp one-liner. Keep titles clean. Ensure links are plausible.
`);
  // For now, store compact summary in bio; later move to dedicated showcase table.
  await upsert({ bio: out.summaryCompact });
}


