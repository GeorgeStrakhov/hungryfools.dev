import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ProjectViewTracker } from "@/components/analytics/project-view-tracker";

type Params = {
  params: Promise<{ handle: string; slug: string }>;
};

export default async function ProjectPage({ params }: Params) {
  const resolvedParams = await params;
  const session = await auth();

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
        eq(projects.slug, resolvedParams.slug),
      ),
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  // Check if this is the owner viewing their own project
  const isOwner = session?.user?.id === profile.userId;

  return (
    <div className="hf-container py-10">
      <ProjectViewTracker
        projectSlug={project.slug}
        projectName={project.name}
        profileHandle={profile.handle}
        isOwner={isOwner}
      />
      {/* Breadcrumb */}
      <div className="text-muted-foreground mb-6 text-sm">
        <a href={`/u/${profile.handle}`} className="hover:underline">
          @{profile.handle}
        </a>
        <span className="mx-2">→</span>
        <span>{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.oneliner && (
              <p className="text-muted-foreground mt-2 text-xl">
                {project.oneliner}
              </p>
            )}
          </div>
          {project.featured && (
            <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm">
              Featured
            </span>
          )}
        </div>

        {/* Project Links */}
        {(project.url || project.githubUrl) && (
          <div className="flex gap-4">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
              >
                <span>View Project</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>View Source</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Project Media */}
      {project.media && project.media.length > 0 && (
        <div className="mb-8">
          <div className="grid gap-4">
            {project.media.map((item, index) => (
              <div key={index} className="overflow-hidden rounded-lg border">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="h-auto w-full"
                  />
                ) : (
                  <video src={item.url} controls className="h-auto w-full">
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
          <h2 className="mb-4 text-xl font-semibold">About this project</h2>
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap">{project.description}</p>
          </div>
        </div>
      )}

      {/* Back to Profile */}
      <div className="border-t pt-8">
        <a
          href={`/u/${profile.handle}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>
            Back to {profile.displayName || profile.handle}&apos;s profile
          </span>
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
        eq(projects.slug, resolvedParams.slug),
      ),
    )
    .limit(1);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name} by ${profile.displayName || profile.handle}`,
    description:
      project.oneliner ||
      project.description ||
      `A project by ${profile.displayName || profile.handle}`,
  };
}
