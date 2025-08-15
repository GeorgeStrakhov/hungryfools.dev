import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import slugify from "slugify";

type Params = { params: Promise<{ handle: string }> };

export default async function EditProfilePage({ params }: Params) {
  const resolvedParams = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Get the profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!profile) {
    notFound();
  }

  // Check if this is the owner
  if (profile.userId !== session.user.id) {
    redirect(`/u/${profile.handle}`);
  }

  const userId = session.user.id;

  const suggestedHandle =
    profile.handle ||
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
    displayName: profile.displayName ?? session.user.name ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    skills: profile.skills?.join(", ") ?? "",
    interests: profile.interests?.join(", ") ?? "",
    location: profile.location ?? "",
    github: profile.links?.github ?? "",
    x: profile.links?.x ?? "",
    website: profile.links?.website ?? "",
    email:
      profile.links?.email ?? (session.user as { email?: string }).email ?? "",
    availHire: profile.availability?.hire ?? false,
    availCollab: profile.availability?.collab ?? false,
    availHiring: profile.availability?.hiring ?? false,
  };

  return (
    <div className="hf-container py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your profile information
          </p>
        </div>
        <ProfileForm defaults={defaults} redirectTo={`/u/${profile.handle}`} />
      </div>
    </div>
  );
}
