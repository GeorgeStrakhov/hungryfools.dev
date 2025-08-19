"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
  profiles,
  projects,
  type ProfileAvailability,
  type ProfileLinks,
} from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { normalizeAndModerate } from "@/lib/moderation/normalize";
import {
  generateDefaultHandle,
  normalizeHandle,
  csvToArray,
  PROFILE_FIELD_LIMITS,
  PROFILE_MODERATION_PROMPT,
} from "@/lib/profile-utils";
import { z } from "zod";
import { onProfileChange } from "@/lib/services/embeddings/lifecycle";

type Input = {
  handle?: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  profileImage?: string; // Custom uploaded profile image
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
  showcase?: boolean;
  // Raw onboarding data
  vibeSelections?: string[];
  vibeText?: string;
  vibeTags?: string[]; // Processed standardized vibe tags
  stackSelections?: string[];
  stackText?: string;
  expertiseSelections?: string[];
};

// Moderation schemas
const profileInput = z.object({
  displayName: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
});

const profileOutput = z.object({
  displayName: z.string().max(PROFILE_FIELD_LIMITS.displayName.max).optional(),
  headline: z.string().max(PROFILE_FIELD_LIMITS.headline.max).optional(),
  bio: z.string().max(PROFILE_FIELD_LIMITS.bio.max).optional(),
  location: z.string().max(PROFILE_FIELD_LIMITS.location.max).optional(),
});

export async function createOrUpdateProfileAction(input: Input) {
  console.log("🔵 [SERVER] createOrUpdateProfileAction received:", JSON.stringify(input, null, 2));
  
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Load existing profile for merge-on-update behavior
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  // Moderate free text fields (only those explicitly provided)
  const textFields = {
    displayName: input.displayName,
    headline: input.headline,
    bio: input.bio,
    location: input.location,
  };
  const fieldsToModerate = Object.fromEntries(
    Object.entries(textFields).filter(([, value]) => value !== undefined && value !== ""),
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
      PROFILE_MODERATION_PROMPT,
    )) as ModeratedFields;
  }

  // Determine final handle
  const userProvidedHandle = Boolean(input.handle && String(input.handle).trim());
  let finalHandle: string;
  if (userProvidedHandle) {
    const requested = normalizeHandle(input.handle as string);
    // Ensure uniqueness
    const existingSameHandle = await db
      .select()
      .from(profiles)
      .where(eq(profiles.handle, requested))
      .limit(1);
    if (existingSameHandle[0] && existingSameHandle[0].userId !== session.user.id) {
      throw new Error("HANDLE_TAKEN");
    }
    finalHandle = requested;
  } else if (existingProfile?.handle) {
    finalHandle = existingProfile.handle;
  } else {
    // New profile with no provided handle → generate default and ensure uniqueness
    let generated = generateDefaultHandle(session.user);
    const existingSameHandle = await db
      .select()
      .from(profiles)
      .where(eq(profiles.handle, generated))
      .limit(1);
    if (existingSameHandle[0] && existingSameHandle[0].userId !== session.user.id) {
      const suffix = Math.random().toString(36).slice(2, 6);
      generated = `${generated}-${suffix}`;
    }
    finalHandle = generated;
  }

  // Merge links (only override provided keys). If no github link exists, prefill from session if possible
  const existingLinks = existingProfile?.links || {};
  const sessionGithub = session.user?.name
    ? undefined
    : undefined; // placeholder if you store github username elsewhere in session
  const links: ProfileLinks = {
    ...existingLinks,
    ...(input.github !== undefined ? { github: input.github || undefined } : {}),
    ...(input.x !== undefined ? { x: input.x || undefined } : {}),
    ...(input.website !== undefined ? { website: input.website || undefined } : {}),
    ...(input.email !== undefined ? { email: input.email || undefined } : {}),
  };
  // Best GitHub link: use stored githubUsername only (never guess from handle)
  const githubUsername = (session.user as any)?.githubUsername as string | null | undefined;
  if (!links.github && githubUsername) {
    links.github = `https://github.com/${githubUsername}`;
  }

  // Merge availability (only override provided flags)
  const existingAvailability = existingProfile?.availability || {};
  const availability: ProfileAvailability = {
    ...existingAvailability,
    ...(input.availHire !== undefined ? { hire: Boolean(input.availHire) } : {}),
    ...(input.availCollab !== undefined ? { collab: Boolean(input.availCollab) } : {}),
    ...(input.availHiring !== undefined ? { hiring: Boolean(input.availHiring) } : {}),
  };

  // Merge top-level fields
  const values = {
    userId: session.user.id,
    handle: finalHandle.toLowerCase(),
    displayName:
      moderatedFields.displayName ?? input.displayName ?? existingProfile?.displayName ?? session.user.name,
    headline: moderatedFields.headline ?? input.headline ?? existingProfile?.headline ?? null,
    bio: moderatedFields.bio ?? input.bio ?? existingProfile?.bio ?? null,
    profileImage: input.profileImage ?? existingProfile?.profileImage ?? null,
    skills:
      input.skills !== undefined
        ? csvToArray(input.skills, PROFILE_FIELD_LIMITS.skills.max)
        : existingProfile?.skills ?? null,
    interests:
      input.interests !== undefined
        ? csvToArray(input.interests, PROFILE_FIELD_LIMITS.interests.max)
        : existingProfile?.interests ?? null,
    location:
      moderatedFields.location ?? (input.location !== undefined ? input.location : existingProfile?.location ?? null),
    links,
    availability,
    showcase: input.showcase !== undefined ? Boolean(input.showcase) : existingProfile?.showcase ?? false,
    // Raw onboarding data
    vibeSelections: input.vibeSelections ?? existingProfile?.vibeSelections ?? null,
    vibeText: input.vibeText ?? existingProfile?.vibeText ?? null,
    vibeTags: input.vibeTags ?? existingProfile?.vibeTags ?? null,
    stackSelections: input.stackSelections ?? existingProfile?.stackSelections ?? null,
    stackText: input.stackText ?? existingProfile?.stackText ?? null,
    expertiseSelections: input.expertiseSelections ?? existingProfile?.expertiseSelections ?? null,
    updatedAt: new Date(),
  };

  if (existingProfile) {
    await db
      .update(profiles)
      .set(values)
      .where(eq(profiles.userId, session.user.id));
  } else {
    await db.insert(profiles).values({ ...values, createdAt: new Date() });
  }

  // Trigger embedding generation for the profile
  // Use immediate mode for new profiles, queued for updates
  const isNewProfile = !existingProfile;
  await onProfileChange(session.user.id, isNewProfile);
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

  const slugifiedHandle = normalizeHandle(handle);
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

/**
 * Fetch a comprehensive user profile with projects
 */
export async function getFullUserProfile(
  identifier: { userId: string } | { handle: string },
) {
  const condition =
    "userId" in identifier
      ? eq(users.id, identifier.userId)
      : eq(profiles.handle, identifier.handle);

  const [result] = await db
    .select({
      user: users,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(condition)
    .limit(1);

  if (!result || !result.profile) {
    return null;
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, result.user.id));

  // We need email for sending, so let's ensure it's there.
  if (!result.user.email) {
    return null;
  }

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    image: result.user.image,
    ...result.profile,
    projects: userProjects.map((p) => ({
      name: p.name,
      url: p.url,
      githubUrl: p.githubUrl,
      oneliner: p.oneliner,
      description: p.description,
    })),
  };
}
