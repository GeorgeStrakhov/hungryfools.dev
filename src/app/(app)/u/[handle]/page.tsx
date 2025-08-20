import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles, projects } from "@/db/schema/profile";
import { eq, desc } from "drizzle-orm";
import { getTransformedImageUrl } from "@/lib/services/s3/s3";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import { IntroductionDialog } from "@/components/profile/introduction-dialog";
import { SignInToIntroduce } from "@/components/profile/sign-in-to-introduce";
import { getProfileAvatarUrl } from "@/lib/utils/avatar";
import { ProfileViewTracker } from "@/components/analytics/profile-view-tracker";
import type { Metadata } from "next";

type Params = { params: Promise<{ handle: string }> };

export default async function PublicProfilePage({ params }: Params) {
  const resolvedParams = await params;
  const session = await auth();

  const [result] = await db
    .select({
      profile: profiles,
      user: users,
    })
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!result?.profile) {
    return (
      <div className="hf-container py-10">
        <h1 className="text-xl">Profile not found</h1>
      </div>
    );
  }

  const profile = result.profile;
  const user = result.user;

  // Check if this is the owner viewing their own profile
  const isOwner = session?.user?.id === profile.userId;

  // Get avatar URL with fallbacks
  const avatarUrl = getProfileAvatarUrl(profile, user);

  // Get user's projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, profile.userId))
    .orderBy(desc(projects.featured), desc(projects.createdAt));

  return (
    <div className="hf-container py-6 md:py-10">
      <ProfileViewTracker
        profileHandle={profile.handle}
        profileId={profile.userId}
        isOwner={isOwner}
      />
      {/* Profile Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {/* Profile Picture */}
            <div className="shrink-0">
              <img
                src={avatarUrl}
                alt={profile.displayName || profile.handle}
                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {profile.displayName || profile.handle}
              </h1>
              <p className="text-muted-foreground mt-1">@{profile.handle}</p>
              {profile.headline && (
                <p className="mt-3 text-base sm:text-lg">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="text-muted-foreground mt-2 text-sm">
                  📍 {profile.location}
                </p>
              )}
              {profile.vibeTags && profile.vibeTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.vibeTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {profile.vibeText && (
                <p className="text-muted-foreground mt-2 text-sm italic">
                  &ldquo;{profile.vibeText}&rdquo;
                </p>
              )}

              {/* Availability Badges - Prominent placement */}
              {profile.availability && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.availability.hire && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Available for hire
                    </Badge>
                  )}
                  {profile.availability.collab && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Open to collaboration
                    </Badge>
                  )}
                  {profile.availability.hiring && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Hiring
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwner ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/u/${profile.handle}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            ) : session?.user ? (
              <IntroductionDialog
                targetHandle={profile.handle}
                targetDisplayName={profile.displayName || profile.handle}
              />
            ) : (
              <SignInToIntroduce profileHandle={profile.handle} />
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="mt-6">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills & Interests */}
        <div className="mt-6 space-y-4">
          {(profile.skills && profile.skills.length > 0) ||
          profile.stackText ? (
            <div>
              <h3 className="mb-2 text-sm font-medium">Skills</h3>
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              {profile.stackText && (
                <p className="text-muted-foreground mt-2 text-sm">
                  <strong>Power tool:</strong> {profile.stackText}
                </p>
              )}
            </div>
          ) : null}

          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Links */}
        {profile.links && Object.keys(profile.links).length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4">
            {profile.links.github && (
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            )}
            {profile.links.x && (
              <a
                href={profile.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {profile.links.website && (
              <a
                href={profile.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </a>
            )}
            {profile.links.email &&
              !isOwner &&
              user?.allowIntroductions &&
              (session?.user ? (
                <IntroductionDialog
                  targetHandle={profile.handle}
                  targetDisplayName={profile.displayName || profile.handle}
                />
              ) : (
                <SignInToIntroduce profileHandle={profile.handle} />
              ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Projects Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Projects</h2>
          {isOwner && (
            <Button size="sm" asChild>
              <Link href={`/u/${profile.handle}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Link>
            </Button>
          )}
        </div>

        {userProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {isOwner
                  ? "You haven't added any projects yet."
                  : "No projects yet."}
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href={`/u/${profile.handle}/projects/new`}>
                    Add Your First Project
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userProjects.map((project) => {
              const firstImage = project.media?.find((m) => m.type === "image");

              return (
                <Card
                  key={project.id}
                  className="group relative overflow-hidden"
                >
                  {/* Always-visible Edit Button for Owners */}
                  {isOwner && (
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-background/90 hover:bg-background h-8 border px-2 shadow-sm backdrop-blur-sm"
                        asChild
                      >
                        <Link
                          href={`/u/${profile.handle}/projects/${project.slug}/edit`}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          <span className="text-xs">Edit</span>
                        </Link>
                      </Button>
                    </div>
                  )}

                  <Link href={`/u/${profile.handle}/p/${project.slug}`}>
                    {/* Project Image */}
                    {firstImage && (
                      <div className="bg-muted aspect-video overflow-hidden">
                        <img
                          src={getTransformedImageUrl(firstImage.url)}
                          alt={project.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold">
                          {project.name}
                        </h3>
                        {project.featured && (
                          <Badge variant="default" className="shrink-0">
                            Featured
                          </Badge>
                        )}
                      </div>

                      {project.oneliner && (
                        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                          {project.oneliner}
                        </p>
                      )}

                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        {project.url && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
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
                            Live
                          </span>
                        )}
                        {project.githubUrl && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Code
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolvedParams = await params;

  const [result] = await db
    .select({
      profile: profiles,
      user: users,
    })
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!result?.profile) {
    return {
      title: "Profile Not Found - HungryFools.dev",
    };
  }

  const profile = result.profile;

  // Build description from available data
  const descriptionParts = [];
  if (profile.headline) descriptionParts.push(profile.headline);
  if (profile.bio) descriptionParts.push(profile.bio.slice(0, 100));
  if (profile.skills && profile.skills.length > 0) {
    descriptionParts.push(`Skills: ${profile.skills.slice(0, 5).join(", ")}`);
  }

  const description =
    descriptionParts.join(" • ") ||
    `${profile.displayName || profile.handle} on HungryFools.dev`;

  const title = `${profile.displayName || profile.handle} (@${profile.handle}) - HungryFools.dev`;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hungryfools.dev"}/api/og/profile?handle=${profile.handle}`;

  return {
    title,
    description,
    keywords: [
      profile.handle,
      profile.displayName || "",
      ...(profile.skills || []),
      ...(profile.vibeTags || []),
      "developer",
      "vibecoder",
      "hungryfools",
    ].filter(Boolean),

    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://hungryfools.dev/u/${profile.handle}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.displayName || profile.handle}'s profile`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: profile.links?.x
        ? `@${profile.links.x.split("/").pop()}`
        : undefined,
    },

    alternates: {
      canonical: `/u/${profile.handle}`,
    },
  };
}
