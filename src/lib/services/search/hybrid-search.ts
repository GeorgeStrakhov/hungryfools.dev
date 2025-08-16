import {
  parseSearchQuery,
  buildStructuredFilters,
  buildSemanticQuery,
  buildKeywordQuery,
  type ParsedQuery,
} from "./query-parser";
import {
  searchByVector,
  searchProfilesWithFilters,
  type VectorSearchResult,
} from "./vector-search";
import {
  buildBM25Index,
  searchBM25Index,
  type BM25Document,
  type BM25Result,
  type BM25Index,
} from "./bm25-search";
import { rerankDocuments } from "@/lib/services/embeddings/embeddings";
import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

export interface HybridSearchResult {
  id: string;
  type: "profile" | "project";
  score: number;

  // Profile fields
  userId?: string;
  handle?: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  availability?: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  };

  // Project fields
  projectId?: string;
  projectName?: string;
  projectOneliner?: string;
  projectDescription?: string;
  projectUrl?: string;

  // Search metadata
  searchMethod: "bm25" | "vector" | "filter" | "rerank";
  originalScore?: number;
  rerankScore?: number;
}

export interface HybridSearchOptions {
  maxResults?: number;
  bm25Weight?: number;
  vectorWeight?: number;
  filterWeight?: number;
  vectorThreshold?: number;
  bm25MinScore?: number;
  enableReranking?: boolean;
  includeProjects?: boolean;
}

// Global BM25 index (in production, this would be cached/persisted)
let globalBM25Index: BM25Index | null = null;

/**
 * Build or rebuild the global BM25 index from all profiles and projects
 */
export async function buildGlobalBM25Index(): Promise<BM25Index> {
  console.log("Building global BM25 index...");

  // Fetch all profiles
  const allProfiles = await db
    .select({
      userId: profiles.userId,
      handle: profiles.handle,
      displayName: profiles.displayName,
      headline: profiles.headline,
      bio: profiles.bio,
      location: profiles.location,
      skills: profiles.skills,
      interests: profiles.interests,
    })
    .from(profiles);

  // Fetch all projects
  const allProjects = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      name: projects.name,
      oneliner: projects.oneliner,
      description: projects.description,
    })
    .from(projects);

  // Convert to BM25 documents
  const documents: BM25Document[] = [];

  // Add profiles
  for (const profile of allProfiles) {
    const content = buildProfileBM25Content(profile);
    documents.push({
      id: `profile:${profile.userId}`,
      content,
    });
  }

  // Add projects
  for (const project of allProjects) {
    const content = buildProjectBM25Content(project);
    documents.push({
      id: `project:${project.id}`,
      content,
    });
  }

  // Build index
  globalBM25Index = buildBM25Index(documents);

  return globalBM25Index;
}

/**
 * Get or build the global BM25 index
 */
async function getBM25Index(): Promise<BM25Index> {
  if (!globalBM25Index) {
    await buildGlobalBM25Index();
  }
  return globalBM25Index!;
}

/**
 * Build BM25 content string for a profile
 */
function buildProfileBM25Content(profile: {
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
}): string {
  const parts: string[] = [];

  if (profile.displayName) parts.push(profile.displayName);
  if (profile.headline) parts.push(profile.headline);
  if (profile.bio) parts.push(profile.bio);
  if (profile.location) parts.push(profile.location);

  if (profile.skills && Array.isArray(profile.skills)) {
    parts.push(...profile.skills);
  }

  if (profile.interests && Array.isArray(profile.interests)) {
    parts.push(...profile.interests);
  }

  return parts.join(" ");
}

/**
 * Build BM25 content string for a project
 */
function buildProjectBM25Content(project: {
  name?: string | null;
  oneliner?: string | null;
  description?: string | null;
}): string {
  const parts: string[] = [];

  if (project.name) parts.push(project.name);
  if (project.oneliner) parts.push(project.oneliner);
  if (project.description) parts.push(project.description);

  return parts.join(" ");
}

/**
 * Perform BM25 keyword search
 */
async function performBM25Search(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
  } = {},
): Promise<BM25Result[]> {
  const index = await getBM25Index();
  return searchBM25Index(index, query, options);
}

/**
 * Convert BM25 results to hybrid search results
 */
async function convertBM25Results(
  bm25Results: BM25Result[],
): Promise<HybridSearchResult[]> {
  const results: HybridSearchResult[] = [];

  for (const result of bm25Results) {
    const [type, id] = result.id.split(":");

    if (type === "profile") {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, id))
        .limit(1);

      if (profile) {
        results.push({
          id: profile.userId,
          type: "profile",
          score: result.score,
          userId: profile.userId,
          handle: profile.handle,
          displayName: profile.displayName || undefined,
          headline: profile.headline || undefined,
          bio: profile.bio || undefined,
          location: profile.location || undefined,
          skills: profile.skills || undefined,
          interests: profile.interests || undefined,
          availability: profile.availability || undefined,
          searchMethod: "bm25",
          originalScore: result.score,
        });
      }
    } else if (type === "project") {
      const [project] = await db
        .select({
          id: projects.id,
          userId: projects.userId,
          name: projects.name,
          oneliner: projects.oneliner,
          description: projects.description,
          url: projects.url,
          ownerHandle: profiles.handle,
          ownerDisplayName: profiles.displayName,
        })
        .from(projects)
        .leftJoin(profiles, eq(profiles.userId, projects.userId))
        .where(eq(projects.id, id))
        .limit(1);

      if (project) {
        results.push({
          id: project.id,
          type: "project",
          score: result.score,
          projectId: project.id,
          projectName: project.name,
          projectOneliner: project.oneliner || undefined,
          projectDescription: project.description || undefined,
          projectUrl: project.url || undefined,
          userId: project.userId,
          handle: project.ownerHandle || undefined,
          displayName: project.ownerDisplayName || undefined,
          searchMethod: "bm25",
          originalScore: result.score,
        });
      }
    }
  }

  return results;
}

/**
 * Convert vector search results to hybrid search results
 */
function convertVectorResults(
  vectorResults: VectorSearchResult[],
): HybridSearchResult[] {
  return vectorResults.map((result) => ({
    id: result.id,
    type: result.type,
    score: result.similarity,
    userId: result.userId,
    handle: result.handle,
    displayName: result.displayName,
    headline: result.headline,
    location: result.location,
    skills: result.skills,
    interests: result.interests,
    projectId: result.projectId,
    projectName: result.projectName,
    projectOneliner: result.projectOneliner,
    searchMethod: "vector",
    originalScore: result.similarity,
  }));
}

/**
 * Fusion scoring: combine BM25 and vector scores
 */
function fuseScores(
  bm25Results: HybridSearchResult[],
  vectorResults: HybridSearchResult[],
  options: {
    bm25Weight: number;
    vectorWeight: number;
  },
): HybridSearchResult[] {
  const { bm25Weight, vectorWeight } = options;

  // Create a map to combine results by ID
  const resultMap = new Map<string, HybridSearchResult>();

  // Add BM25 results
  for (const result of bm25Results) {
    const fusedScore = result.score * bm25Weight;
    resultMap.set(result.id, {
      ...result,
      score: fusedScore,
      searchMethod: "bm25",
    });
  }

  // Add or combine vector results
  for (const result of vectorResults) {
    const fusedScore = result.score * vectorWeight;

    if (resultMap.has(result.id)) {
      // Combine scores
      const existing = resultMap.get(result.id)!;
      existing.score += fusedScore;
      existing.searchMethod = "bm25+vector" as
        | "bm25"
        | "vector"
        | "filter"
        | "rerank";
    } else {
      // Add new result
      resultMap.set(result.id, {
        ...result,
        score: fusedScore,
        searchMethod: "vector",
      });
    }
  }

  // Sort by combined score
  const fusedResults = Array.from(resultMap.values());
  fusedResults.sort((a, b) => b.score - a.score);

  return fusedResults;
}

/**
 * Apply reranking using BGE reranker
 */
async function applyReranking(
  query: string,
  results: HybridSearchResult[],
): Promise<HybridSearchResult[]> {
  if (results.length === 0) return results;

  console.log(`Applying BGE reranking to ${results.length} results...`);

  // Build documents for reranking
  const documents = results.map((result) => {
    if (result.type === "profile") {
      return `${result.displayName} ${result.headline || ""} ${result.bio || ""} ${result.location || ""}`.trim();
    } else {
      return `${result.projectName} ${result.projectOneliner || ""} ${result.projectDescription || ""}`.trim();
    }
  });

  try {
    const reranked = await rerankDocuments({
      query,
      documents,
      topK: Math.min(results.length, 20), // Limit reranking to top 20
    });

    // Map reranked scores back to results
    const rerankedResults: HybridSearchResult[] = [];

    for (const rerankResult of reranked.results) {
      const originalResult = results[rerankResult.index];
      if (originalResult) {
        rerankedResults.push({
          ...originalResult,
          score: rerankResult.score,
          searchMethod: "rerank",
          originalScore: originalResult.score,
          rerankScore: rerankResult.score,
        });
      }
    }

    console.log(`Reranking completed: ${rerankedResults.length} results`);
    return rerankedResults;
  } catch (error) {
    console.error("Reranking failed:", error);
    return results; // Return original results if reranking fails
  }
}

/**
 * Main hybrid search function
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {},
): Promise<{
  results: HybridSearchResult[];
  parsedQuery: ParsedQuery;
  timing: {
    parsing: number;
    bm25: number;
    vector: number;
    filtering: number;
    fusion: number;
    reranking: number;
    total: number;
  };
}> {
  const startTime = Date.now();
  const timing = {
    parsing: 0,
    bm25: 0,
    vector: 0,
    filtering: 0,
    fusion: 0,
    reranking: 0,
    total: 0,
  };

  const {
    maxResults = 20,
    bm25Weight = 0.4,
    vectorWeight = 0.4,
    filterWeight = 0.2,
    vectorThreshold = 0.3,
    bm25MinScore = 0.1,
    enableReranking = true,
    includeProjects = true,
  } = options;

  console.log(`\n🔍 Hybrid search: "${query}"`);

  // 1. Parse query
  const parseStart = Date.now();
  const parsedQuery = await parseSearchQuery(query);
  timing.parsing = Date.now() - parseStart;

  console.log(`   📝 Parsed in ${timing.parsing}ms:`, {
    intent: parsedQuery.intent,
    entities: {
      companies: parsedQuery.companies,
      locations: parsedQuery.locations,
      skills: parsedQuery.skills,
      interests: parsedQuery.interests,
    },
    confidence: parsedQuery.confidence,
  });

  // 2. Build search queries
  const keywordQuery = buildKeywordQuery(parsedQuery);
  const semanticQuery = buildSemanticQuery(parsedQuery);
  const structuredFilters = buildStructuredFilters(parsedQuery);

  console.log(`   🔤 Keyword query: "${keywordQuery}"`);
  console.log(`   🧠 Semantic query: "${semanticQuery}"`);
  console.log(`   🔍 Filters:`, structuredFilters);

  // 3. Parallel search execution
  const searchPromises = [];

  // BM25 keyword search
  if (keywordQuery.trim()) {
    const bm25Start = Date.now();
    searchPromises.push(
      performBM25Search(keywordQuery, {
        topK: Math.ceil(maxResults * 1.5),
        minScore: bm25MinScore,
      }).then(async (results) => {
        timing.bm25 = Date.now() - bm25Start;
        console.log(
          `   📊 BM25 found ${results.length} results in ${timing.bm25}ms`,
        );
        return convertBM25Results(results);
      }),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  // Vector semantic search
  if (semanticQuery.trim()) {
    const vectorStart = Date.now();
    searchPromises.push(
      searchByVector(semanticQuery, {
        threshold: vectorThreshold,
        limit: Math.ceil(maxResults * 1.5),
        includeProjects,
      }).then((results) => {
        timing.vector = Date.now() - vectorStart;
        console.log(
          `   🧠 Vector found ${results.length} results in ${timing.vector}ms`,
        );
        return convertVectorResults(results);
      }),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  // Structured filter search
  if (Object.keys(structuredFilters).length > 0) {
    const filterStart = Date.now();
    searchPromises.push(
      searchProfilesWithFilters(structuredFilters, {
        limit: Math.ceil(maxResults * 1.5),
      }).then((results) => {
        timing.filtering = Date.now() - filterStart;
        console.log(
          `   🔍 Filter found ${results.length} results in ${timing.filtering}ms`,
        );
        return convertVectorResults(results);
      }),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  // Execute all searches in parallel
  const [bm25Results, vectorResults, filterResults] =
    await Promise.all(searchPromises);

  // 4. Score fusion
  const fusionStart = Date.now();

  // Combine BM25 and vector results
  let fusedResults = fuseScores(bm25Results, vectorResults, {
    bm25Weight,
    vectorWeight,
  });

  // Add filter results with boost
  for (const filterResult of filterResults) {
    const existing = fusedResults.find((r) => r.id === filterResult.id);
    if (existing) {
      // Boost existing result
      existing.score += filterWeight;
    } else {
      // Add new result with filter weight
      fusedResults.push({
        ...filterResult,
        score: filterWeight,
        searchMethod: "filter",
      });
    }
  }

  // Sort by final score
  fusedResults.sort((a, b) => b.score - a.score);
  fusedResults = fusedResults.slice(0, maxResults * 2); // Keep extra for reranking

  timing.fusion = Date.now() - fusionStart;
  console.log(
    `   🔄 Fusion completed in ${timing.fusion}ms: ${fusedResults.length} combined results`,
  );

  // 5. Optional reranking
  let finalResults = fusedResults;
  if (enableReranking && fusedResults.length > 1) {
    const rerankStart = Date.now();
    finalResults = await applyReranking(query, fusedResults);
    timing.reranking = Date.now() - rerankStart;
    console.log(`   🎯 Reranking completed in ${timing.reranking}ms`);
  }

  // Final result set
  finalResults = finalResults.slice(0, maxResults);

  timing.total = Date.now() - startTime;
  console.log(
    `\n✅ Search completed in ${timing.total}ms: ${finalResults.length} final results`,
  );

  return {
    results: finalResults,
    parsedQuery,
    timing,
  };
}

/**
 * Initialize the search system
 */
export async function initializeSearch(): Promise<void> {
  console.log("🚀 Initializing hybrid search system...");
  await buildGlobalBM25Index();
  console.log("✅ Search system ready");
}

/**
 * Refresh the search index (call after data changes)
 */
export async function refreshSearchIndex(): Promise<void> {
  console.log("🔄 Refreshing search index...");
  await buildGlobalBM25Index();
  console.log("✅ Search index refreshed");
}
