import Link from "next/link";
import { ExternalLink, Github, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderMarkdownPreview } from "@/lib/utils/markdown-client";
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
    <Card className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-6">
        {/* Header with title and featured badge */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="flex-1 text-xl leading-tight font-semibold">
            {project.ownerHandle ? (
              <Link
                href={`/u/${project.ownerHandle}/p/${project.slug}`}
                className="hover:text-primary transition-colors"
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
          {project.featured && (
            <Badge className="flex-shrink-0 bg-yellow-500 text-yellow-900 hover:bg-yellow-600">
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>

        {/* One-liner */}
        {project.oneliner && (
          <p className="text-muted-foreground mb-3 text-sm font-medium">
            {project.oneliner}
          </p>
        )}

        {/* Description with markdown rendering */}
        <div className="mb-4 flex-1">
          {project.description && (
            <div
              className="prose prose-sm text-muted-foreground line-clamp-4 max-w-none text-sm"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownPreview(project.description),
              }}
            />
          )}
        </div>

        {/* Compact image strip */}
        {primaryImage && (
          <div className="mb-4 overflow-hidden rounded-md">
            <img
              src={primaryImage.url}
              alt={project.name}
              className="h-20 w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* Owner info */}
        {showOwner && project.ownerHandle && (
          <div className="mb-4 flex items-center gap-2">
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
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
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
        <div className="flex items-center gap-4 border-t pt-4">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
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
              className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
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
