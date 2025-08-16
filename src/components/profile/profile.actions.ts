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
      PROFILE_MODERATION_PROMPT,
    )) as ModeratedFields;
  }

  // Derive handle when not provided
  const userProvidedHandle = Boolean(
    input.handle && String(input.handle).trim(),
  );
  let derivedHandle = input.handle ? normalizeHandle(input.handle) : "";
  if (!derivedHandle) {
    derivedHandle = generateDefaultHandle(session.user);
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
    displayName:
      moderatedFields.displayName || input.displayName || session.user.name,
    headline: moderatedFields.headline || input.headline,
    bio: moderatedFields.bio || input.bio || null,
    profileImage: input.profileImage,
    skills: csvToArray(input.skills, PROFILE_FIELD_LIMITS.skills.max),
    interests: csvToArray(input.interests, PROFILE_FIELD_LIMITS.interests.max),
    location: moderatedFields.location || input.location || null,
    links,
    availability,
    showcase: Boolean(input.showcase),
    // Raw onboarding data
    vibeSelections: input.vibeSelections,
    vibeText: input.vibeText,
    stackSelections: input.stackSelections,
    stackText: input.stackText,
    expertiseSelections: input.expertiseSelections,
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

  // Trigger embedding generation for the profile
  // Use immediate mode for new profiles, queued for updates
  const isNewProfile = !existingSameHandle[0] || existingSameHandle[0].userId !== session.user.id;
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
