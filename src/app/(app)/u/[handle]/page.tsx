import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ handle: string }> };

export default async function PublicProfilePage({ params }: Params) {
  const resolvedParams = await params;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!profile) {
    return (
      <div className="hf-container py-10">
        <h1 className="text-xl">Profile not found</h1>
      </div>
    );
  }

  return (
    <div className="hf-container py-10">
      <h1 className="mb-2 text-3xl font-semibold">{profile.displayName}</h1>
      <p className="text-muted-foreground mb-4">@{profile.handle}</p>
      <p className="mb-6">{profile.headline}</p>
      {profile.skills?.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="bg-accent text-accent-foreground rounded px-2 py-1 text-sm"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}
      {profile.bio ? (
        <p className="mb-8 whitespace-pre-wrap">{profile.bio}</p>
      ) : null}
      <div className="space-y-1">
        {profile.links?.github && (
          <a className="underline" href={profile.links.github} target="_blank">
            GitHub
          </a>
        )}
        {profile.links?.x && (
          <a className="block underline" href={profile.links.x} target="_blank">
            X
          </a>
        )}
        {profile.links?.website && (
          <a
            className="block underline"
            href={profile.links.website}
            target="_blank"
          >
            Website
          </a>
        )}
        {profile.links?.email && (
          <a className="block underline" href={`mailto:${profile.links.email}`}>
            Email
          </a>
        )}
      </div>
    </div>
  );
}
