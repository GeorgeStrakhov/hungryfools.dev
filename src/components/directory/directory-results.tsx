import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTransformedImageUrl } from "@/lib/services/s3/s3";
import { getProfileAvatarUrl } from "@/lib/utils/avatar";
import { SearchMatchIndicator } from "./search-match-indicator";
import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";
import type { DirectorySearchResult } from "@/app/actions/search";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface DirectoryResultsProps {
  results: DirectorySearchResult[];
  isLoading?: boolean;
  searchQuery?: string;
  parsedQuery?: {
    companies: string[];
    locations: string[];
    skills: string[];
    interests: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
    strictFilters?: {
      locations?: string[];
      skills?: string[];
      companies?: string[];
      availability?: {
        hire?: boolean;
        collab?: boolean;
        hiring?: boolean;
      };
    };
  };
}

export function DirectoryResults({
  results,
  isLoading = false,
  searchQuery = "",
  parsedQuery,
}: DirectoryResultsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="bg-muted h-12 w-12 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="bg-muted h-4 rounded" />
                    <div className="bg-muted h-3 w-2/3 rounded" />
                    <div className="bg-muted h-3 w-1/2 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-muted h-3 rounded" />
                  <div className="bg-muted h-3 w-3/4 rounded" />
                </div>
                <div className="mt-4 flex gap-1">
                  <div className="bg-muted h-6 w-16 rounded px-2 py-1" />
                  <div className="bg-muted h-6 w-20 rounded px-2 py-1" />
                  <div className="bg-muted h-6 w-12 rounded px-2 py-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {results.map((profile, index) => {
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
              {/* Search Match Indicator */}
              <SearchMatchIndicator
                profile={profile}
                position={index}
                searchQuery={searchQuery}
                parsedQuery={parsedQuery}
              />

              {/* Header - Avatar + Identity */}
              <Link
                href={`/u/${profile.handle}`}
                className="group/header mb-4 flex items-start gap-3 transition-opacity hover:opacity-80"
                onClick={() => {
                  analytics.track(ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED, {
                    result_type: "profile",
                    profile_handle: profile.handle,
                    search_query: searchQuery,
                    position: index + 1,
                  });
                }}
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
                onClick={() => {
                  analytics.track(ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED, {
                    result_type: "profile",
                    profile_handle: profile.handle,
                    search_query: searchQuery,
                    position: index + 1,
                    source: "view_profile_cta",
                  });
                }}
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
