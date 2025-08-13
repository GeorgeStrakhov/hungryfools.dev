"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  profiles,
  type ProfileAvailability,
  type ProfileLinks,
} from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import slugify from "slugify";
import { normalizeAndModerate } from "@/lib/moderation/normalize";
import { z } from "zod";

type Input = {
  handle?: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  skills?: string; // comma separated
  interests?: string; // comma separated
  location?: string;
  github?: string;
  x?: string;
  website?: string;
  email?: string;
  availHire?: boolean;
  availCollab?: boolean;
  availHiring?: boolean;
};

function toArray(csv?: string): string[] | undefined {
  if (!csv) return undefined;
  return csv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
}

// Moderation schemas
const profileInput = z.object({
  displayName: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
});

const profileOutput = z.object({
  displayName: z.string().max(100).optional(),
  headline: z.string().max(140).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

export async function createOrUpdateProfileAction(input: Input) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Moderate free text fields
  const textFields = {
    displayName: input.displayName,
    headline: input.headline,
    bio: input.bio,
    location: input.location,
  };

  // Filter out undefined values for moderation
  const fieldsToModerate = Object.fromEntries(
    Object.entries(textFields).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );

  type ModeratedFields = {
    displayName?: string;
    headline?: string;
    bio?: string;
    location?: string;
  };

  let moderatedFields: ModeratedFields = {};
  if (Object.keys(fieldsToModerate).length > 0) {
    moderatedFields = (await normalizeAndModerate(
      fieldsToModerate,
      profileInput,
      profileOutput,
      `
You are moderating user profile content for a developer community platform.
- Keep content professional and appropriate for public display
- Remove spam, promotional content, inappropriate content
- Preserve the user's authentic voice while ensuring safety
- For location: normalize to "City, State/Country" format when possible
- For headlines: keep punchy and professional (max 140 chars)
- For bio: maintain personality while removing inappropriate content (max 500 chars)
- For display names: keep professional and recognizable (max 100 chars)
      `.trim(),
    )) as ModeratedFields;
  }

  // Derive handle when not provided
  const userProvidedHandle = Boolean(
    input.handle && String(input.handle).trim(),
  );
  let derivedHandle = (input.handle || "").toString().trim();
  if (!derivedHandle) {
    const displayName = session.user.name || "";
    const emailLocal = session.user.email?.split("@")[0] || "";
    if (
      displayName &&
      slugify(displayName, { lower: true, strict: true, trim: true })
    )
      derivedHandle = slugify(displayName, {
        lower: true,
        strict: true,
        trim: true,
      });
    else if (emailLocal)
      derivedHandle = slugify(emailLocal, {
        lower: true,
        strict: true,
        trim: true,
      });
    else derivedHandle = `user-${session.user.id.slice(0, 8)}`;
  }
  // Ensure handle not empty after slugify
  if (!derivedHandle) {
    derivedHandle = `user-${session.user.id.slice(0, 8)}`;
  }

  // Ensure uniqueness: if handle is taken by another user, append suffix
  const existingSameHandle = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, derivedHandle))
    .limit(1);
  if (
    existingSameHandle[0] &&
    existingSameHandle[0].userId !== session.user.id
  ) {
    if (userProvidedHandle) {
      // If user explicitly chose this handle, surface an error to the UI instead of silently changing it
      throw new Error("HANDLE_TAKEN");
    } else {
      const suffix = Math.random().toString(36).slice(2, 6);
      derivedHandle = `${derivedHandle}-${suffix}`;
    }
  }

  const links: ProfileLinks = {
    github: input.github || undefined,
    x: input.x || undefined,
    website: input.website || undefined,
    email: input.email || undefined,
  };

  const availability: ProfileAvailability = {
    hire: Boolean(input.availHire),
    collab: Boolean(input.availCollab),
    hiring: Boolean(input.availHiring),
  };

  const values = {
    userId: session.user.id,
    handle: derivedHandle.toLowerCase(),
    displayName: moderatedFields.displayName || input.displayName,
    headline: moderatedFields.headline || input.headline,
    bio: moderatedFields.bio || input.bio || null,
    skills: toArray(input.skills),
    interests: toArray(input.interests),
    location: moderatedFields.location || input.location || null,
    links,
    availability,
    updatedAt: new Date(),
  };

  await db
    .insert(profiles)
    .values({
      ...values,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: values,
    });
}

export async function getOwnProfileAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);
  return row ?? null;
}

export async function checkHandleAvailabilityAction(handle: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const slugifiedHandle = slugify(handle, {
    lower: true,
    strict: true,
    trim: true,
  });
  if (!slugifiedHandle) return { available: false, error: "Invalid handle" };

  const existing = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.handle, slugifiedHandle))
    .limit(1);

  const isOwnHandle = existing[0]?.userId === session.user.id;
  const available = !existing[0] || isOwnHandle;

  return {
    available,
    handle: slugifiedHandle,
    isOwnHandle: isOwnHandle || false,
  };
}
