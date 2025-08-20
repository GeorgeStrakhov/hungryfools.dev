"use client";

import { useState, useEffect } from "react";
import {
  searchProjects,
  type ProjectSearchResult,
} from "@/app/actions/projects-search";
import { ProjectSearch } from "./project-search";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface ProjectSearchContainerProps {
  searchParams: {
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
  };
}

export function ProjectSearchContainer({
  searchParams,
}: ProjectSearchContainerProps) {
  const [initialData, setInitialData] = useState<{
    query: string;
    results: ProjectSearchResult[];
    count: number;
    timing?: {
      vector: number;
      keywords: number;
      reranking: number;
      total: number;
    };
    page: number;
    limit: number;
    sort: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      const q = (searchParams.q ?? "").trim();
      const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
      const limit = [12, 24, 48].includes(
        parseInt(searchParams.limit ?? "24", 10),
      )
        ? parseInt(searchParams.limit ?? "24", 10)
        : 24;
      const sort = searchParams.sort ?? (q ? "relevance" : "recent");

      try {
        const searchResult = await searchProjects(q, {
          page,
          limit,
          sort: sort as "relevance" | "recent" | "featured" | "name" | "random",
        });

        // Track project search analytics
        if (q.trim()) {
          analytics.track(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
            query: q,
            search_type: "projects",
            results_count: searchResult.totalCount,
            response_time_ms: searchResult.timing?.total,
            page: page,
            sort: sort,
          });
        }

        setInitialData({
          query: q,
          results: searchResult.results,
          count: searchResult.totalCount,
          timing: searchResult.timing,
          page,
          limit,
          sort,
        });
      } catch (error) {
        console.error("Failed to load initial project search data:", error);
        // Set empty state on error
        setInitialData({
          query: q,
          results: [],
          count: 0,
          page,
          limit,
          sort,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [
    searchParams.q,
    searchParams.page,
    searchParams.limit,
    searchParams.sort,
  ]); // React to URL parameter changes

  if (isLoading || !initialData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectSearch
      initialQuery={initialData.query}
      initialResults={initialData.results}
      initialCount={initialData.count}
      initialTiming={initialData.timing}
      initialPage={initialData.page}
      initialLimit={initialData.limit}
      initialSort={initialData.sort}
    />
  );
}
