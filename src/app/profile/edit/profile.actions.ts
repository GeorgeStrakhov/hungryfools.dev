"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { profiles, type ProfileAvailability, type ProfileLinks } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

type Input = {
  handle?: string;
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

  function slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Derive handle when not provided
  const userProvidedHandle = Boolean(input.handle && String(input.handle).trim());
  let derivedHandle = (input.handle || "").toString().trim();
  if (!derivedHandle) {
    const displayName = session.user.name || "";
    const emailLocal = (session.user as any).email?.split("@")[0] || "";
    if (displayName && slugify(displayName)) derivedHandle = slugify(displayName);
    else if (emailLocal) derivedHandle = slugify(emailLocal);
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
  if (existingSameHandle[0] && existingSameHandle[0].userId !== session.user.id) {
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


