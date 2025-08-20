"use server";

import {
  searchProjects as searchProjectsCore,
  browseProjects as browseProjectsCore,
  type ProjectSearchResult as CoreProjectSearchResult,
} from "@/lib/services/search/projects-search";

// Re-export the core interface
export type ProjectSearchResult = CoreProjectSearchResult;

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: "relevance" | "recent" | "featured" | "name" | "random";
}

/**
 * Search projects using dedicated project search engine
 */
export async function searchProjects(
  query: string,
  options: PaginationOptions = {},
): Promise<{
  results: ProjectSearchResult[];
  totalCount: number;
  timing?: {
    vector: number;
    keywords: number;
    reranking: number;
    total: number;
  };
}> {
  const trimmedQuery = query.trim();
  const {
    page = 1,
    limit = 24,
    sort = trimmedQuery ? "relevance" : "recent",
  } = options;

  // If no query, return browse projects
  if (!trimmedQuery) {
    const browseResult = await browseProjectsCore({ page, limit, sort });
    return {
      results: browseResult.results,
      totalCount: browseResult.totalCount,
      timing: {
        vector: 0,
        keywords: 0,
        reranking: 0,
        total: 0,
      },
    };
  }

  try {
    // Use dedicated project search
    const searchResult = await searchProjectsCore(trimmedQuery, {
      page,
      limit,
      sort: sort as "relevance" | "recent" | "featured" | "name" | "random",
      threshold: 0.4, // Higher threshold for projects
      enableReranking: true,
    });

    return {
      results: searchResult.results,
      totalCount: searchResult.totalCount,
      timing: searchResult.timing,
    };
  } catch (error) {
    console.error("❌ Project search failed:", error);

    // Fallback to browse mode
    const browseResult = await browseProjectsCore({ page, limit, sort });
    return {
      results: browseResult.results,
      totalCount: browseResult.totalCount,
      timing: {
        vector: 0,
        keywords: 0,
        reranking: 0,
        total: 0,
      },
    };
  }
}
