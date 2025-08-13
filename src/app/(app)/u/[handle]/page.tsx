import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { eq, desc } from "drizzle-orm";

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

  // Get user's projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, profile.userId))
    .orderBy(desc(projects.featured), desc(projects.createdAt));

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
      
      {/* Projects Section */}
      {userProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="grid gap-4">
            {userProjects.map((project) => (
              <a
                key={project.id}
                href={`/u/${profile.handle}/p/${project.slug}`}
                className="block border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.oneliner && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {project.oneliner}
                      </p>
                    )}
                  </div>
                  {project.featured && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
                {project.url && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {project.url}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contact Links */}
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
