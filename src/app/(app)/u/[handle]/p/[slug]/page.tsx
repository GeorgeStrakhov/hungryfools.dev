import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

type Params = { 
  params: Promise<{ handle: string; slug: string }> 
};

export default async function ProjectPage({ params }: Params) {
  const resolvedParams = await params;
  
  // First get the profile to get userId
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!profile) {
    notFound();
  }

  // Then get the specific project
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, profile.userId),
        eq(projects.slug, resolvedParams.slug)
      )
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  return (
    <div className="hf-container py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-muted-foreground">
        <a href={`/u/${profile.handle}`} className="hover:underline">
          @{profile.handle}
        </a>
        <span className="mx-2">→</span>
        <span>{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.oneliner && (
              <p className="text-xl text-muted-foreground mt-2">
                {project.oneliner}
              </p>
            )}
          </div>
          {project.featured && (
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
              Featured
            </span>
          )}
        </div>

        {/* Project Links */}
        {project.url && (
          <div className="flex gap-4">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>View Project</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Project Media */}
      {project.media && project.media.length > 0 && (
        <div className="mb-8">
          <div className="grid gap-4">
            {project.media.map((item, index) => (
              <div key={index} className="rounded-lg overflow-hidden border">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-auto"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-auto"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Description */}
      {project.description && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">About this project</h2>
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap">{project.description}</p>
          </div>
        </div>
      )}

      {/* Back to Profile */}
      <div className="pt-8 border-t">
        <a
          href={`/u/${profile.handle}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to {profile.displayName || profile.handle}'s profile</span>
        </a>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Params) {
  const resolvedParams = await params;
  
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!profile) {
    return {};
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, profile.userId),
        eq(projects.slug, resolvedParams.slug)
      )
    )
    .limit(1);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name} by ${profile.displayName || profile.handle}`,
    description: project.oneliner || project.description || `A project by ${profile.displayName || profile.handle}`,
  };
}