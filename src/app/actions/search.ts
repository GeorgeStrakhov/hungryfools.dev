"use server";

import {
  hybridSearch,
  initializeSearch,
} from "@/lib/services/search/hybrid-search";
import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { users } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";

export interface DirectorySearchResult {
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
    media: { type: string; url: string }[] | null;
    featured: boolean | null;
  }>;
  searchScore?: number;
  searchMethod?: string;
}

// Initialize search system on first call
let searchInitialized = false;

async function ensureSearchInitialized() {
  if (!searchInitialized) {
    await initializeSearch();
    searchInitialized = true;
  }
}

/**
 * Apply strict filters to search results (hard filtering)
 */
function applyStrictFilters(
  results: DirectorySearchResult[],
  strictFilters: {
    locations?: string[];
    skills?: string[];
    companies?: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
  },
): DirectorySearchResult[] {
  return results.filter((profile) => {
    // Check strict location filter
    if (strictFilters.locations && strictFilters.locations.length > 0) {
      const hasMatchingLocation = strictFilters.locations.some(
        (filterLocation) =>
          profile.location
            ?.toLowerCase()
            .includes(filterLocation.toLowerCase()),
      );
      if (!hasMatchingLocation) return false;
    }

    // Check strict skills filter
    if (strictFilters.skills && strictFilters.skills.length > 0) {
      const hasMatchingSkill = strictFilters.skills.some((filterSkill) =>
        profile.skills?.some(
          (profileSkill) =>
            profileSkill.toLowerCase().includes(filterSkill.toLowerCase()) ||
            filterSkill.toLowerCase().includes(profileSkill.toLowerCase()),
        ),
      );
      if (!hasMatchingSkill) return false;
    }

    // Check strict company filter (check headline and display name)
    if (strictFilters.companies && strictFilters.companies.length > 0) {
      const hasMatchingCompany = strictFilters.companies.some(
        (filterCompany) =>
          profile.headline
            ?.toLowerCase()
            .includes(filterCompany.toLowerCase()) ||
          profile.displayName
            ?.toLowerCase()
            .includes(filterCompany.toLowerCase()),
      );
      if (!hasMatchingCompany) return false;
    }

    // Check strict availability filter
    if (strictFilters.availability) {
      if (strictFilters.availability.hire && !profile.availability?.hire)
        return false;
      if (strictFilters.availability.collab && !profile.availability?.collab)
        return false;
      if (strictFilters.availability.hiring && !profile.availability?.hiring)
        return false;
    }

    return true;
  });
}

/**
 * Perform smart hybrid search on the directory
 */
export async function searchDirectory(query: string): Promise<{
  results: DirectorySearchResult[];
  totalCount: number;
  timing?: {
    parsing: number;
    bm25: number;
    vector: number;
    filtering: number;
    fusion: number;
    reranking: number;
    total: number;
  };
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
}> {
  const trimmedQuery = query.trim();

  // If no query, return recent profiles
  if (!trimmedQuery) {
    return await getRecentProfiles();
  }

  try {
    // Ensure search system is initialized
    await ensureSearchInitialized();

    // Perform hybrid search
    const searchResult = await hybridSearch(trimmedQuery, {
      maxResults: 48,
      enableReranking: true,
      includeProjects: true,
    });

    // Convert hybrid search results to directory format
    const profileIds = new Set<string>();
    const profileResults = searchResult.results.filter((result) => {
      if (
        result.type === "profile" &&
        result.userId &&
        !profileIds.has(result.userId)
      ) {
        profileIds.add(result.userId);
        return true;
      }
      return false;
    });

    // Fetch complete profile data for the search results
    const directoryResults: DirectorySearchResult[] = [];

    for (const searchResult of profileResults) {
      if (!searchResult.userId) continue;

      // Get complete profile data
      const profileData = await db
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
        })
        .from(profiles)
        .leftJoin(users, eq(profiles.userId, users.id))
        .where(eq(profiles.userId, searchResult.userId))
        .limit(1);

      if (profileData.length === 0) continue;

      const profile = profileData[0];

      // Get projects for this profile
      const projectData = await db
        .select({
          name: projects.name,
          slug: projects.slug,
          oneliner: projects.oneliner,
          description: projects.description,
          media: projects.media,
          featured: projects.featured,
        })
        .from(projects)
        .where(eq(projects.userId, profile.userId))
        .orderBy(desc(projects.featured), desc(projects.createdAt))
        .limit(2);

      directoryResults.push({
        userId: profile.userId,
        handle: profile.handle,
        displayName: profile.displayName,
        headline: profile.headline,
        skills: profile.skills,
        interests: profile.interests,
        location: profile.location,
        availability: profile.availability,
        profileImage: profile.profileImage,
        userImage: profile.userImage,
        projects: projectData,
        searchScore: searchResult.score,
        searchMethod: searchResult.searchMethod,
      });
    }

    // Apply strict filters if they exist
    let finalResults = directoryResults;
    if (
      searchResult.parsedQuery.strictFilters &&
      Object.keys(searchResult.parsedQuery.strictFilters).length > 0
    ) {
      console.log(
        "Applying strict filters:",
        searchResult.parsedQuery.strictFilters,
      );

      // Convert null to undefined for availability fields
      const strictFilters = {
        ...searchResult.parsedQuery.strictFilters,
        availability: searchResult.parsedQuery.strictFilters.availability
          ? {
              hire:
                searchResult.parsedQuery.strictFilters.availability.hire ||
                undefined,
              collab:
                searchResult.parsedQuery.strictFilters.availability.collab ||
                undefined,
              hiring:
                searchResult.parsedQuery.strictFilters.availability.hiring ||
                undefined,
            }
          : undefined,
      };

      finalResults = applyStrictFilters(directoryResults, strictFilters);
      console.log(
        `Strict filters applied: ${directoryResults.length} → ${finalResults.length} results`,
      );
    }

    return {
      results: finalResults,
      totalCount: finalResults.length,
      timing: searchResult.timing,
      parsedQuery: {
        companies: searchResult.parsedQuery.companies,
        locations: searchResult.parsedQuery.locations,
        skills: searchResult.parsedQuery.skills,
        interests: searchResult.parsedQuery.interests,
        availability: searchResult.parsedQuery.availability
          ? {
              hire: searchResult.parsedQuery.availability.hire || undefined,
              collab: searchResult.parsedQuery.availability.collab || undefined,
              hiring: searchResult.parsedQuery.availability.hiring || undefined,
            }
          : undefined,
        strictFilters: searchResult.parsedQuery.strictFilters
          ? {
              locations:
                searchResult.parsedQuery.strictFilters.locations || undefined,
              skills:
                searchResult.parsedQuery.strictFilters.skills || undefined,
              companies:
                searchResult.parsedQuery.strictFilters.companies || undefined,
              availability: searchResult.parsedQuery.strictFilters.availability
                ? {
                    hire:
                      searchResult.parsedQuery.strictFilters.availability
                        .hire || undefined,
                    collab:
                      searchResult.parsedQuery.strictFilters.availability
                        .collab || undefined,
                    hiring:
                      searchResult.parsedQuery.strictFilters.availability
                        .hiring || undefined,
                  }
                : undefined,
            }
          : undefined,
      },
    };
  } catch (error) {
    console.error("Hybrid search failed, falling back to basic search:", error);
    return await fallbackSearch();
  }
}

/**
 * Fallback to basic SQL search if hybrid search fails
 */
async function fallbackSearch(): Promise<{
  results: DirectorySearchResult[];
  totalCount: number;
}> {
  // For now, just return recent profiles as fallback
  // In production, you'd implement proper ILIKE search here
  return await getRecentProfiles();
}

/**
 * Get recent profiles when no search query
 */
async function getRecentProfiles(): Promise<{
  results: DirectorySearchResult[];
  totalCount: number;
}> {
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
    .orderBy(desc(profiles.createdAt))
    .limit(200);

  const grouped = groupProfileResults(results);

  return {
    results: grouped.slice(0, 48),
    totalCount: grouped.length,
  };
}

/**
 * Group profile results to avoid duplicates
 */
function groupProfileResults(
  results: {
    userId: string;
    handle: string;
    displayName: string | null;
    headline: string | null;
    skills: string[] | null;
    interests: string[] | null;
    location: string | null;
    availability: { hire?: boolean; collab?: boolean; hiring?: boolean } | null;
    profileImage: string | null;
    userImage: string | null;
    projectName: string | null;
    projectSlug: string | null;
    projectOneliner: string | null;
    projectDescription: string | null;
    projectMedia: { type: string; url: string }[] | null;
    projectFeatured: boolean | null;
  }[],
): DirectorySearchResult[] {
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

      // Add project if it exists
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
    {} as Record<string, DirectorySearchResult>,
  );

  // Process final results and limit projects per person
  return Object.values(groupedResults).map((profile) => ({
    ...profile,
    // Sort projects by featured first, then limit to top 2
    projects: profile.projects
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      .slice(0, 2),
  }));
}
