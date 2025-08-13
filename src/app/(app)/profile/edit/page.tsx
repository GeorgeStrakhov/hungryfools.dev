import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { ProfileForm } from "./profile-form";
import slugify from "slugify";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="hf-container py-10">
        <p>Please sign in to edit your profile.</p>
      </div>
    );
  }
  const userId = session.user.id;
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const suggestedHandle =
    existing?.handle ||
    (session.user.email
      ? slugify(session.user.email.split("@")[0] || "", {
          lower: true,
          strict: true,
          trim: true,
        })
      : "") ||
    (session.user.name
      ? slugify(session.user.name, { lower: true, strict: true, trim: true })
      : "") ||
    `user-${userId.slice(0, 8)}`;

  const defaults = {
    handle: suggestedHandle,
    displayName: existing?.displayName ?? session.user.name ?? "",
    headline: existing?.headline ?? "",
    bio: existing?.bio ?? "",
    skills: existing?.skills?.join(", ") ?? "",
    interests: existing?.interests?.join(", ") ?? "",
    location: existing?.location ?? "",
    github: existing?.links?.github ?? "",
    x: existing?.links?.x ?? "",
    website: existing?.links?.website ?? "",
    email:
      existing?.links?.email ??
      (session.user as { email?: string }).email ??
      "",
    availHire: existing?.availability?.hire ?? false,
    availCollab: existing?.availability?.collab ?? false,
    availHiring: existing?.availability?.hiring ?? false,
  };
  return (
    <div className="hf-container py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit your profile</h1>
      <ProfileForm defaults={defaults} />
    </div>
  );
}
