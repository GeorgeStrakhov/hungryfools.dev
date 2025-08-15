import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles, projects, ProjectMedia } from "@/db/schema/profile";
import { ilike, or, eq, desc } from "drizzle-orm";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTransformedImageUrl } from "@/lib/services/s3/s3";
import { getProfileAvatarUrl } from "@/lib/utils/avatar";
import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function DirectoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();

  // Get profiles with enhanced data including users and projects
  const results = await db
    .select({
      // Profile data
      userId: profiles.userId,
      handle: profiles.handle,
      displayName: profiles.displayName,
      headline: profiles.headline,
      skills: profiles.skills,
      interests: profiles.interests,
      location: profiles.location,
      availability: profiles.availability,
      profileImage: profiles.profileImage,
      // User data
      userImage: users.image,
      // Project data
      projectName: projects.name,
      projectSlug: projects.slug,
      projectOneliner: projects.oneliner,
      projectDescription: projects.description,
      projectMedia: projects.media,
      projectFeatured: projects.featured,
    })
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .leftJoin(projects, eq(profiles.userId, projects.userId))
    .where(
      q
        ? or(
            ilike(profiles.headline, `%${q}%`),
            ilike(profiles.displayName, `%${q}%`),
            ilike(projects.name, `%${q}%`),
            ilike(projects.oneliner, `%${q}%`),
            ilike(projects.description, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(desc(profiles.createdAt))
    .limit(200);

  // Group results by user to avoid duplicates
  interface EnhancedProfile {
    userId: string;
    handle: string;
    displayName: string | null;
    headline: string | null;
    skills: string[] | null;
    interests: string[] | null;
    location: string | null;
    availability: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    } | null;
    profileImage: string | null;
    userImage: string | null;
    projects: Array<{
      name: string;
      slug: string;
      oneliner: string | null;
      description: string | null;
      media: ProjectMedia[] | null;
      featured: boolean | null;
    }>;
  }

  const groupedResults = results.reduce(
    (acc, row) => {
      const key = row.userId;
      if (!acc[key]) {
        acc[key] = {
          userId: row.userId,
          handle: row.handle,
          displayName: row.displayName,
          headline: row.headline,
          skills: row.skills,
          interests: row.interests,
          location: row.location,
          availability: row.availability,
          profileImage: row.profileImage,
          userImage: row.userImage,
          projects: [],
        };
      }

      // Add project if it exists - always include projects for context
      if (row.projectName && row.projectSlug) {
        acc[key].projects.push({
          name: row.projectName,
          slug: row.projectSlug,
          oneliner: row.projectOneliner,
          description: row.projectDescription,
          media: row.projectMedia,
          featured: row.projectFeatured,
        });
      }

      return acc;
    },
    {} as Record<string, EnhancedProfile>,
  );

  // Process final results and limit projects per person
  const finalResults = Object.values(groupedResults)
    .map((profile) => ({
      ...profile,
      // Sort projects by featured first, then limit to top 2
      projects: profile.projects
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        .slice(0, 2),
    }))
    .slice(0, 48);

  const totalCount = finalResults.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Input */}
      <div className="mb-8">
        <SearchInput
          name="q"
          defaultValue={q}
          controlled={false}
          showIcon={true}
          className="bg-input border-input h-12 w-full rounded-md px-4"
        />
        {q && (
          <p className="text-muted-foreground mt-2 text-sm">
            Found {totalCount} developer{totalCount !== 1 ? "s" : ""} matching
            &ldquo;{q}&rdquo;
          </p>
        )}
        {!q && (
          <p className="text-muted-foreground mt-2 text-sm">
            Showing {totalCount} developer{totalCount !== 1 ? "s" : ""} in the
            directory
          </p>
        )}
      </div>

      {/* Results Grid */}
      {finalResults.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {q ? (
              <>No developers found matching &ldquo;{q}&rdquo;</>
            ) : (
              "No developers found"
            )}
          </p>
          {q && (
            <p className="text-muted-foreground mt-2 text-sm">
              Try a different search term or{" "}
              <Link href="/directory" className="underline">
                browse all developers
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {finalResults.map((profile) => {
            const avatarUrl = getProfileAvatarUrl(
              { profileImage: profile.profileImage },
              { image: profile.userImage },
            );

            return (
              <Card
                key={profile.userId}
                className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  {/* Header - Avatar + Identity */}
                  <Link
                    href={`/u/${profile.handle}`}
                    className="group/header mb-4 flex items-start gap-3 transition-opacity hover:opacity-80"
                  >
                    <img
                      src={avatarUrl}
                      alt={profile.displayName || profile.handle}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold transition-colors">
                        {profile.displayName || profile.handle}
                      </h3>
                      <p className="text-muted-foreground truncate text-sm">
                        @{profile.handle}
                      </p>
                      {profile.location && (
                        <div className="mt-1 flex items-center gap-1">
                          <MapPin className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground truncate text-xs">
                            {profile.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Headline */}
                  {profile.headline && (
                    <p className="text-foreground mb-4 line-clamp-2 text-sm">
                      {profile.headline}
                    </p>
                  )}

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Availability Badges */}
                  {profile.availability && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {profile.availability.hire && (
                        <Badge className="bg-green-100 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                          🟢 For Hire
                        </Badge>
                      )}
                      {profile.availability.collab && (
                        <Badge className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          🔵 Collaboration
                        </Badge>
                      )}
                      {profile.availability.hiring && (
                        <Badge className="bg-purple-100 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          🟣 Hiring
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Projects Preview */}
                  {profile.projects.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-muted-foreground mb-2 text-xs font-medium">
                        Recent Projects
                      </h4>
                      <div className="space-y-2">
                        {profile.projects.map((project, idx) => {
                          const firstImage = project.media?.find(
                            (m) => m.type === "image",
                          );
                          return (
                            <div key={idx} className="flex gap-2">
                              {firstImage && (
                                <div className="shrink-0">
                                  <img
                                    src={getTransformedImageUrl(firstImage.url)}
                                    alt={project.name}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                  {project.name}
                                  {project.featured && (
                                    <span className="ml-1 text-xs">⭐</span>
                                  )}
                                </p>
                                {project.oneliner && (
                                  <p className="text-muted-foreground truncate text-xs">
                                    {project.oneliner}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* View Profile CTA */}
                  <Link
                    href={`/u/${profile.handle}`}
                    className="text-muted-foreground hover:text-foreground group-hover:text-foreground mt-auto flex w-full items-center justify-center gap-1 text-sm transition-colors"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
