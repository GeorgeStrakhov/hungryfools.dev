import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

type Params = { params: { handle: string } };

export default async function PublicProfilePage({ params }: Params) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, params.handle.toLowerCase()))
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
      <h1 className="text-3xl font-semibold mb-2">{profile.displayName}</h1>
      <p className="text-muted-foreground mb-4">@{profile.handle}</p>
      <p className="mb-6">{profile.headline}</p>
      {profile.skills?.length ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.skills.map((s) => (
            <span key={s} className="px-2 py-1 rounded bg-accent text-accent-foreground text-sm">
              {s}
            </span>
          ))}
        </div>
      ) : null}
      {profile.bio ? <p className="whitespace-pre-wrap mb-8">{profile.bio}</p> : null}
      <div className="space-y-1">
        {profile.links?.github && (
          <a className="underline" href={profile.links.github} target="_blank">GitHub</a>
        )}
        {profile.links?.x && (
          <a className="underline block" href={profile.links.x} target="_blank">X</a>
        )}
        {profile.links?.website && (
          <a className="underline block" href={profile.links.website} target="_blank">Website</a>
        )}
        {profile.links?.email && (
          <a className="underline block" href={`mailto:${profile.links.email}`}>Email</a>
        )}
      </div>
    </div>
  );
}


