"use client";

import { useState, useEffect } from "react";
import {
  searchDirectory,
  type DirectorySearchResult,
} from "@/app/actions/search";
import { DirectorySearch } from "./directory-search";

interface DirectorySearchContainerProps {
  searchParams: {
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
  };
}

export function DirectorySearchContainer({
  searchParams,
}: DirectorySearchContainerProps) {
  const [initialData, setInitialData] = useState<{
    query: string;
    results: DirectorySearchResult[];
    count: number;
    timing?: {
      parsing: number;
      bm25: number;
      vector: number;
      filtering: number;
      fusion: number;
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
      const sort = searchParams.sort ?? (q ? "relevance" : "random");

      try {
        const searchResult = await searchDirectory(q, {
          page,
          limit,
          sort: sort as "relevance" | "recent" | "name" | "random",
        });

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
        console.error("Failed to load initial search data:", error);
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
          <p className="text-muted-foreground">Loading directory...</p>
        </div>
      </div>
    );
  }

  return (
    <DirectorySearch
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
