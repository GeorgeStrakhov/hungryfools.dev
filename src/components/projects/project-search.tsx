"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Loader2, Brain } from "lucide-react";
import {
  searchProjects,
  type ProjectSearchResult,
} from "@/app/actions/projects-search";
import { ProjectResults } from "./project-results";
import { PaginationBottom } from "../directory/pagination-bottom";

interface ProjectSearchProps {
  initialQuery: string;
  initialResults: ProjectSearchResult[];
  initialCount: number;
  initialTiming?: {
    vector: number;
    keywords: number;
    reranking: number;
    total: number;
  };
  initialPage?: number;
  initialLimit?: number;
  initialSort?: string;
}

export function ProjectSearch({
  initialQuery,
  initialResults,
  initialCount,
  initialTiming,
  initialPage = 1,
  initialLimit = 24,
  initialSort = "recent",
}: ProjectSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAbortController = useRef<AbortController | undefined>(undefined);
  const performSearchRef =
    useRef<
      (
        query: string,
        options?: { page?: number; limit?: number; sort?: string },
      ) => Promise<void>
    >(undefined);
  const isInternalUpdateRef = useRef(false);

  // Simple input state - only search on explicit user action
  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchInputKey, setSearchInputKey] = useState(0); // Key to force re-render of SearchInput
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [count, setCount] = useState(initialCount);
  const [timing, setTiming] = useState(initialTiming);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState(initialSort);

  // Perform the actual search
  const performSearch = useCallback(
    async (
      query: string,
      options?: { page?: number; limit?: number; sort?: string },
    ) => {
      // Use provided options or current state
      const searchPage = options?.page ?? page;
      const searchLimit = options?.limit ?? limit;

      // Determine appropriate sort: if no sort specified in options, use context-appropriate default
      const searchSort =
        options?.sort ?? sort ?? (query.trim() ? "relevance" : "recent");

      // Avoid duplicate searches
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      searchAbortController.current = new AbortController();

      try {
        setIsSearching(true);

        const searchResult = await searchProjects(query, {
          page: searchPage,
          limit: searchLimit,
          sort: searchSort as
            | "relevance"
            | "recent"
            | "featured"
            | "name"
            | "random",
        });

        // Check if this request was aborted
        if (searchAbortController.current?.signal.aborted) {
          return;
        }

        setResults(searchResult.results);
        setCount(searchResult.totalCount);
        setTiming(searchResult.timing);

        // Update URL without triggering a navigation
        isInternalUpdateRef.current = true;
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query);
        if (searchPage > 1) params.set("page", searchPage.toString());
        if (searchLimit !== 24) params.set("limit", searchLimit.toString());
        if (searchSort !== (query.trim() ? "relevance" : "recent")) {
          params.set("sort", searchSort);
        }

        const newUrl = `/projects${params.toString() ? `?${params.toString()}` : ""}`;
        router.replace(newUrl, { scroll: false });

        // Update internal state after URL update
        setSearchQuery(query);
        setPage(searchPage);
        setLimit(searchLimit);
        setSort(searchSort);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
        searchAbortController.current = undefined;
      }
    },
    [page, limit, sort, router],
  );

  // Store the function in a ref so it can be used in useEffect
  performSearchRef.current = performSearch;

  // Handle URL parameter changes (external navigation)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const q = searchParams.get("q") || "";
    const newPage = parseInt(searchParams.get("page") || "1", 10);
    const newLimit = parseInt(searchParams.get("limit") || "24", 10);
    const newSort = searchParams.get("sort") || (q ? "relevance" : "recent");

    // Update input to match URL
    setInputValue(q);
    setSearchInputKey((prev) => prev + 1); // Force SearchInput to re-render with new defaultValue

    // Perform search if parameters changed
    if (
      q !== searchQuery ||
      newPage !== page ||
      newLimit !== limit ||
      newSort !== sort
    ) {
      performSearchRef.current?.(q, {
        page: newPage,
        limit: newLimit,
        sort: newSort,
      });
    }
  }, [searchParams, searchQuery, page, limit, sort]);

  // Handle search submission
  const handleSearch = (query: string) => {
    performSearch(query, { page: 1 }); // Reset to page 1 for new searches
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    performSearch(searchQuery, { page: newPage });
  };

  // Handle limit changes
  const handleLimitChange = (newLimit: number) => {
    performSearch(searchQuery, { page: 1, limit: newLimit });
  };

  // Handle sort changes
  const handleSortChange = (newSort: string) => {
    performSearch(searchQuery, { page: 1, sort: newSort });
  };

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <SearchInput
          key={searchInputKey}
          defaultValue={inputValue}
          onChange={setInputValue}
          onSubmit={handleSearch}
          basePlaceholder="Search projects by name, description, technology..."
          controlled={true}
          suggestions={[
            "React dashboard with real-time analytics",
            "Next.js e-commerce platform with Stripe integration",
            "AI-powered chatbot using OpenAI API",
            "mobile app built with React Native",
            "Python web scraper for data analysis",
            "TypeScript library for API validation",
            "Vue.js portfolio website with animations",
            "Node.js REST API with authentication",
            "Chrome extension for productivity",
            "game built with Unity and C#",
            "Discord bot with moderation features",
            "blockchain app using Solidity",
            "machine learning model with TensorFlow",
            "iOS app using SwiftUI",
            "Docker containerized microservices",
            "GraphQL API with Apollo Server",
            "Progressive Web App with offline support",
            "Electron desktop application",
            "Rust CLI tool for developers",
            "Go backend service with gRPC",
          ]}
        />

        {/* Search status and controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Results count and status */}
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground text-sm">
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching projects...
                </div>
              ) : (
                <span>
                  {count.toLocaleString()} project{count !== 1 ? "s" : ""} found
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
              )}
            </div>

            {/* AI/Timing indicator */}
            {timing && !isSearching && (
              <div className="hidden items-center gap-1 sm:flex">
                <Brain className="text-muted-foreground h-3 w-3" />
                <span className="text-muted-foreground text-xs">
                  {timing.total}ms
                </span>
              </div>
            )}
          </div>

          {/* Sort and Limit Controls Only */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Sort:</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                disabled={isSearching}
                className="rounded border px-2 py-1 text-sm"
              >
                {searchQuery && <option value="relevance">Relevance</option>}
                <option value="recent">Recent</option>
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="random">Random</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                disabled={isSearching}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search insights - simplified */}
        {timing && searchQuery && timing.total > 0 && (
          <div className="text-muted-foreground text-xs">
            <span>Search completed in {timing.total}ms</span>
            {timing.reranking > 0 && (
              <span className="ml-3">• Results reranked for relevance</span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <ProjectResults
        results={results}
        isLoading={isSearching}
        searchQuery={searchQuery}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationBottom
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isSearching}
        />
      )}
    </div>
  );
}
