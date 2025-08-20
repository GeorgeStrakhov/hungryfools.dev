import Link from "next/link";
import { ExternalLink, Github, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectSearchResult } from "@/app/actions/projects-search";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface ProjectCardProps {
  project: ProjectSearchResult;
  showOwner?: boolean;
}

export function ProjectCard({ project, showOwner = true }: ProjectCardProps) {
  // Get the primary image for display
  const primaryImage = project.media?.find((m) => m.type === "image");

  return (
    <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Media section */}
      {primaryImage && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={primaryImage.url}
            alt={project.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {project.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-yellow-500 text-yellow-900">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="flex h-full flex-col p-4">
        {/* Project header */}
        <div className="mb-3 flex-1">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="line-clamp-2 text-lg leading-tight font-semibold">
              {project.ownerHandle ? (
                <Link
                  href={`/u/${project.ownerHandle}/p/${project.slug}`}
                  className="transition-colors"
                  onClick={() => {
                    analytics.track(ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED, {
                      result_type: "project",
                      project_slug: project.slug,
                      project_name: project.name,
                      owner_handle: project.ownerHandle,
                    });
                  }}
                >
                  {project.name}
                </Link>
              ) : (
                <span>{project.name}</span>
              )}
            </h3>
            {!primaryImage && project.featured && (
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>

          {/* One-liner */}
          {project.oneliner && (
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              {project.oneliner}
            </p>
          )}

          {/* Description */}
          {project.description && (
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {project.description}
            </p>
          )}
        </div>

        {/* Owner info (if enabled) */}
        {showOwner && project.ownerHandle && (
          <div className="mb-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={
                  project.ownerProfileImage ||
                  project.ownerUserImage ||
                  undefined
                }
                alt={project.ownerDisplayName || project.ownerHandle}
              />
              <AvatarFallback className="text-xs">
                {(project.ownerDisplayName || project.ownerHandle)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link
                href={`/u/${project.ownerHandle}`}
                className="text-muted-foreground text-sm transition-colors"
                onClick={() => {
                  analytics.track(ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED, {
                    result_type: "profile",
                    profile_handle: project.ownerHandle,
                    source: "project_card",
                  });
                }}
              >
                <span className="truncate">
                  {project.ownerDisplayName || `@${project.ownerHandle}`}
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Action links */}
        <div className="flex items-center gap-3 pt-2">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground flex items-center gap-1 text-sm transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Live Demo</span>
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground flex items-center gap-1 text-sm transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>Code</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
