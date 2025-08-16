"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Loader2, Brain } from "lucide-react";
import {
  searchDirectory,
  type DirectorySearchResult,
} from "@/app/actions/search";
import { DirectoryResults } from "./directory-results";

interface DirectorySearchProps {
  initialQuery: string;
  initialResults: DirectorySearchResult[];
  initialCount: number;
  initialTiming?: {
    parsing: number;
    bm25: number;
    vector: number;
    filtering: number;
    fusion: number;
    reranking: number;
    total: number;
  };
}

export function DirectorySearch({
  initialQuery,
  initialResults,
  initialCount,
  initialTiming,
}: DirectorySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAbortController = useRef<AbortController | undefined>(undefined);
  const performSearchRef = useRef<(query: string) => Promise<void>>();
  const isInternalUpdateRef = useRef(false);

  // Simple input state - only search on explicit user action
  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [count, setCount] = useState(initialCount);
  const [timing, setTiming] = useState(initialTiming);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<
    | {
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
      }
    | undefined
  >();

  // Perform the actual search
  const performSearch = useCallback(
    async (query: string) => {
      // Don't search if query hasn't changed
      if (query === searchQuery) return;

      setSearchQuery(query);
      setIsSearching(true);

      try {
        // Create new abort controller for this search
        searchAbortController.current = new AbortController();

        const searchResult = await searchDirectory(query);

        // Only update state if search wasn't aborted
        if (!searchAbortController.current.signal.aborted) {
          setResults(searchResult.results);
          setCount(searchResult.totalCount);
          setTiming(searchResult.timing);
          setParsedQuery(searchResult.parsedQuery);

          // Update URL after successful search
          isInternalUpdateRef.current = true;
          const params = new URLSearchParams();
          if (query) {
            params.set("q", query);
          }
          const newUrl = `/directory${params.toString() ? `?${params.toString()}` : ""}`;
          router.replace(newUrl, { scroll: false });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search failed:", error);
          // Keep existing results on error
        }
      } finally {
        if (!searchAbortController.current?.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [router, searchQuery],
  );

  // Keep ref updated with latest performSearch function
  performSearchRef.current = performSearch;

  // Handle input changes (just update input state, no search)
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Handle search submission (Enter key or search icon)
  const handleSearch = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();
      setInputValue(trimmedValue); // Sync input value with what we're actually searching
      performSearch(trimmedValue);
    },
    [performSearch],
  );

  // Handle URL changes (back/forward navigation)
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    
    // If this was our own URL update, just reset the flag and don't react
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    
    // This is external navigation (back/forward), sync the input and search
    setInputValue(urlQuery);
    if (performSearchRef.current) {
      performSearchRef.current(urlQuery);
    }
  }, [searchParams]);

  // Create a stable key for remounting only on URL navigation
  const searchInputKey = searchParams.get("q") || "empty";

  return (
    <div>
      {/* Search Input with Loading State */}
      <div className="mb-8">
        <div className="relative">
          <SearchInput
            key={searchInputKey}
            name="q"
            defaultValue={inputValue}
            controlled={false}
            showIcon={true}
            className="bg-input border-input h-12 w-full rounded-md px-4 pr-12"
            onChange={handleInputChange}
            onSubmit={handleSearch}
          />

          {/* Loading State */}
          {isSearching && (
            <div className="absolute top-1/2 right-16 -translate-y-1/2">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Status */}
        {searchQuery && (
          <div className="mt-4 flex items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4 animate-pulse" />
                  Searching...
                </span>
              ) : (
                <>
                  Found {count} vibecoder{count !== 1 ? "s" : ""} matching
                  &ldquo;{searchQuery}&rdquo;
                </>
              )}
            </p>

            {/* Smart Search Indicator */}
            {!isSearching && timing && (
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                🧠 Smart Search ({timing.total}ms)
              </span>
            )}
          </div>
        )}

        {!searchQuery && !isSearching && (
          <p className="text-muted-foreground mt-4 text-sm">
            Showing {count} vibecoder{count !== 1 ? "s" : ""} in the directory
          </p>
        )}
      </div>

      {/* Search Results */}
      <div className="relative">
        {/* Loading Overlay */}
        {isSearching && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-background flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg">
              <Brain className="text-primary h-5 w-5 animate-pulse" />
              <div className="text-sm">
                <div className="font-medium">Intelligent Search</div>
                <div className="text-muted-foreground">
                  Analyzing query & ranking results...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length === 0 && !isSearching ? (
          <div className="py-12">
            <p className="text-muted-foreground">
              {searchQuery ? (
                <>No developers found matching &ldquo;{searchQuery}&rdquo;</>
              ) : (
                "No developers found"
              )}
            </p>
            {searchQuery && (
              <p className="text-muted-foreground mt-2 text-sm">
                Try a different search term or{" "}
                <button
                  onClick={() => handleSearch("")}
                  className="underline hover:no-underline"
                >
                  browse all developers
                </button>
              </p>
            )}
          </div>
        ) : (
          <DirectoryResults
            results={results}
            isLoading={isSearching}
            searchQuery={searchQuery}
            parsedQuery={parsedQuery}
          />
        )}
      </div>
    </div>
  );
}
