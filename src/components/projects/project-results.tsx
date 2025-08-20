"use client";

import { ProjectCard } from "./project-card";
import type { ProjectSearchResult } from "@/app/actions/projects-search";

interface ProjectResultsProps {
  results: ProjectSearchResult[];
  isLoading: boolean;
  searchQuery: string;
}

export function ProjectResults({
  results,
  isLoading,
  searchQuery,
}: ProjectResultsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-muted h-64 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="text-6xl">🔍</div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-medium">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? `We couldn't find any projects matching "${searchQuery}". Try different keywords or browse all projects.`
              : "Projects will appear here as community members showcase their work."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((project) => (
        <ProjectCard key={project.id} project={project} showOwner={true} />
      ))}
    </div>
  );
}
