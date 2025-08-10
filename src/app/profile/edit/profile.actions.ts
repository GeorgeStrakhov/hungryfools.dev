"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { profiles, type ProfileAvailability, type ProfileLinks } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

type Input = {
  handle: string;
  displayName: string;
  headline: string;
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

export async function createOrUpdateProfileAction(input: Input) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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
    handle: input.handle.toLowerCase(),
    displayName: input.displayName,
    headline: input.headline,
    bio: input.bio || null,
    skills: toArray(input.skills),
    interests: toArray(input.interests),
    location: input.location || null,
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


