import { db } from "@/db";
import { profiles, projects, projectEmbeddings } from "@/db/schema/profile";
import { users } from "@/db/schema/auth";
import { eq, desc, asc, sql, and, gt } from "drizzle-orm";
import {
  generateEmbeddings,
  rerankDocuments,
} from "@/lib/services/embeddings/embeddings";

export interface ProjectSearchResult {
  id: string;
  userId: string;
  slug: string;
  name: string;
  url: string | null;
  githubUrl: string | null;
  oneliner: string | null;
  description: string | null;
  media: { type: string; url: string }[] | null;
  featured: boolean;
  createdAt: Date;
  // Owner information
  ownerHandle: string | null;
  ownerDisplayName: string | null;
  ownerProfileImage: string | null;
  ownerUserImage: string | null;
  // Search metadata (simplified)
  searchScore?: number;
}

export interface ProjectSearchOptions {
  page?: number;
  limit?: number;
  sort?: "relevance" | "recent" | "featured" | "name" | "random";
  threshold?: number; // Vector similarity threshold
  enableReranking?: boolean;
}

/**
 * Simple BM25-style keyword search for projects
 */
async function searchProjectsByKeywords(
  query: string,
  options: { limit?: number } = {},
): Promise<ProjectSearchResult[]> {
  const { limit = 50 } = options;

  console.log(`🔍 BM25 keyword search for: "${query}"`);

  // Simple ILIKE search across project fields
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 2);
  if (keywords.length === 0) return [];

  // Build ILIKE conditions for each keyword
  const conditions = keywords.map((keyword) => {
    const pattern = `%${keyword}%`;
    return sql`(
      LOWER(${projects.name}) LIKE ${pattern} OR
      LOWER(${projects.oneliner}) LIKE ${pattern} OR  
      LOWER(${projects.description}) LIKE ${pattern}
    )`;
  });

  // Combine with AND (all keywords must match somewhere)
  const whereClause =
    conditions.length > 1
      ? sql`${conditions[0]} AND ${sql.join(conditions.slice(1), sql` AND `)}`
      : conditions[0];

  const results = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      slug: projects.slug,
      name: projects.name,
      url: projects.url,
      githubUrl: projects.githubUrl,
      oneliner: projects.oneliner,
      description: projects.description,
      media: projects.media,
      featured: projects.featured,
      createdAt: projects.createdAt,
      ownerHandle: profiles.handle,
      ownerDisplayName: profiles.displayName,
      ownerProfileImage: profiles.profileImage,
      ownerUserImage: users.image,
    })
    .from(projects)
    .leftJoin(profiles, eq(projects.userId, profiles.userId))
    .leftJoin(users, eq(projects.userId, users.id))
    .where(and(whereClause, eq(users.onboardingCompleted, true)))
    .orderBy(desc(projects.featured), desc(projects.createdAt))
    .limit(limit);

  console.log(`📊 BM25 found ${results.length} keyword matches`);

  return results.map((project) => ({
    id: project.id,
    userId: project.userId,
    slug: project.slug,
    name: project.name,
    url: project.url,
    githubUrl: project.githubUrl,
    oneliner: project.oneliner,
    description: project.description,
    media: project.media,
    featured: project.featured,
    createdAt: project.createdAt,
    ownerHandle: project.ownerHandle,
    ownerDisplayName: project.ownerDisplayName,
    ownerProfileImage: project.ownerProfileImage,
    ownerUserImage: project.ownerUserImage,
  }));
}

/**
 * Vector similarity search for projects
 */
async function searchProjectsByVector(
  query: string,
  options: { threshold?: number; limit?: number } = {},
): Promise<ProjectSearchResult[]> {
  const { threshold = 0.4, limit = 50 } = options; // Higher threshold for projects

  console.log(`🧠 Vector search for: "${query}" (threshold: ${threshold})`);

  try {
    // Generate embedding for query
    const embeddingResponse = await generateEmbeddings({
      input: query,
      model: "@cf/baai/bge-m3",
    });

    const queryEmbedding = embeddingResponse.embeddings[0];
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn("❌ Failed to generate query embedding");
      return [];
    }

    // Calculate cosine similarity
    const similarity = sql<number>`1 - (${sql.raw("project_embeddings.embedding")} <=> ${sql.placeholder("queryEmbedding")})`;

    const results = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        slug: projects.slug,
        name: projects.name,
        url: projects.url,
        githubUrl: projects.githubUrl,
        oneliner: projects.oneliner,
        description: projects.description,
        media: projects.media,
        featured: projects.featured,
        createdAt: projects.createdAt,
        ownerHandle: profiles.handle,
        ownerDisplayName: profiles.displayName,
        ownerProfileImage: profiles.profileImage,
        ownerUserImage: users.image,
        similarity,
      })
      .from(projectEmbeddings)
      .innerJoin(projects, eq(projects.id, projectEmbeddings.projectId))
      .leftJoin(profiles, eq(projects.userId, profiles.userId))
      .leftJoin(users, eq(projects.userId, users.id))
      .where(
        and(gt(similarity, threshold), eq(users.onboardingCompleted, true)),
      )
      .orderBy(desc(similarity))
      .limit(limit)
      .execute({ queryEmbedding: JSON.stringify(queryEmbedding) });

    console.log(
      `📊 Vector search found ${results.length} results above threshold ${threshold}`,
    );

    return results.map((project) => ({
      id: project.id,
      userId: project.userId,
      slug: project.slug,
      name: project.name,
      url: project.url,
      githubUrl: project.githubUrl,
      oneliner: project.oneliner,
      description: project.description,
      media: project.media,
      featured: project.featured,
      createdAt: project.createdAt,
      ownerHandle: project.ownerHandle,
      ownerDisplayName: project.ownerDisplayName,
      ownerProfileImage: project.ownerProfileImage,
      ownerUserImage: project.ownerUserImage,
      searchScore: project.similarity,
    }));
  } catch (error) {
    console.error("❌ Vector search failed:", error);
    return [];
  }
}

/**
 * Apply reranking to project results
 */
async function rerankProjectResults(
  query: string,
  results: ProjectSearchResult[],
): Promise<ProjectSearchResult[]> {
  if (results.length <= 1) return results;

  console.log(`🎯 Reranking ${results.length} project results`);

  try {
    // Build project-specific documents for reranking
    const documents = results.map((project) => {
      const parts: string[] = [];

      // Project name (most important)
      if (project.name) parts.push(project.name);

      // One-liner (concise description)
      if (project.oneliner) parts.push(project.oneliner);

      // Full description
      if (project.description) parts.push(project.description);

      // Owner context (less important)
      if (project.ownerDisplayName) {
        parts.push(`by ${project.ownerDisplayName}`);
      }

      return parts.join(". ");
    });

    const reranked = await rerankDocuments({
      query,
      documents,
      topK: Math.min(results.length, 20),
    });

    const rerankedResults: ProjectSearchResult[] = [];
    for (const rerankResult of reranked.results) {
      const originalResult = results[rerankResult.index];
      if (originalResult) {
        rerankedResults.push({
          ...originalResult,
          searchScore: rerankResult.score,
        });
      }
    }

    console.log(`📊 Reranking completed: ${rerankedResults.length} results`);
    return rerankedResults;
  } catch (error) {
    console.error("❌ Reranking failed:", error);
    return results; // Return original results if reranking fails
  }
}

/**
 * Combine and deduplicate search results
 */
function combineResults(
  vectorResults: ProjectSearchResult[],
  keywordResults: ProjectSearchResult[],
  options: { maxResults?: number } = {},
): ProjectSearchResult[] {
  const { maxResults = 50 } = options;

  // Create a map to deduplicate by project ID
  const resultMap = new Map<string, ProjectSearchResult>();

  // Add vector results first (higher quality)
  vectorResults.forEach((result) => {
    resultMap.set(result.id, {
      ...result,
      searchScore: result.searchScore || 0,
    });
  });

  // Add keyword results (fill gaps)
  keywordResults.forEach((result) => {
    if (!resultMap.has(result.id)) {
      resultMap.set(result.id, {
        ...result,
        searchScore: 0.3, // Default score for keyword-only matches
      });
    }
  });

  // Convert to array and sort by score
  const combined = Array.from(resultMap.values());
  combined.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));

  console.log(
    `🔀 Combined ${vectorResults.length} vector + ${keywordResults.length} keyword = ${combined.length} unique results`,
  );

  return combined.slice(0, maxResults);
}

/**
 * Main project search function
 */
export async function searchProjects(
  query: string,
  options: ProjectSearchOptions = {},
): Promise<{
  results: ProjectSearchResult[];
  totalCount: number;
  timing: {
    vector: number;
    keywords: number;
    reranking: number;
    total: number;
  };
}> {
  const startTime = Date.now();
  const {
    page = 1,
    limit = 24,
    sort = "relevance",
    threshold = 0.4,
    enableReranking = true,
  } = options;

  const timing = {
    vector: 0,
    keywords: 0,
    reranking: 0,
    total: 0,
  };

  console.log(`\n🚀 Project search: "${query}"`);

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    // Return browse mode for empty queries
    return {
      results: [],
      totalCount: 0,
      timing,
    };
  }

  try {
    // Run vector and keyword searches in parallel
    const vectorStart = Date.now();
    const keywordStart = Date.now();

    const [vectorResults, keywordResults] = await Promise.all([
      searchProjectsByVector(trimmedQuery, {
        threshold,
        limit: limit * 2, // Get more for combination
      }),
      searchProjectsByKeywords(trimmedQuery, {
        limit: limit * 2,
      }),
    ]);

    timing.vector = Date.now() - vectorStart;
    timing.keywords = Date.now() - keywordStart;

    // Combine results
    let combinedResults = combineResults(vectorResults, keywordResults, {
      maxResults: limit * 3, // Extra for reranking
    });

    // Apply reranking if enabled and we have multiple results
    if (enableReranking && combinedResults.length > 1) {
      const rerankStart = Date.now();
      combinedResults = await rerankProjectResults(
        trimmedQuery,
        combinedResults,
      );
      timing.reranking = Date.now() - rerankStart;
    }

    // Apply sorting if not relevance
    if (sort !== "relevance") {
      combinedResults = sortProjectResults(combinedResults, sort);
    }

    // Apply pagination
    const totalCount = combinedResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = combinedResults.slice(
      startIndex,
      startIndex + limit,
    );

    timing.total = Date.now() - startTime;

    console.log(
      `✅ Search completed in ${timing.total}ms: ${paginatedResults.length}/${totalCount} results`,
    );

    return {
      results: paginatedResults,
      totalCount,
      timing,
    };
  } catch (error) {
    timing.total = Date.now() - startTime;
    console.error("❌ Project search failed:", error);

    return {
      results: [],
      totalCount: 0,
      timing,
    };
  }
}

/**
 * Browse projects without search query
 */
export async function browseProjects(
  options: { page?: number; limit?: number; sort?: string } = {},
): Promise<{
  results: ProjectSearchResult[];
  totalCount: number;
}> {
  const { page = 1, limit = 24, sort = "recent" } = options;

  console.log(`📂 Browse projects: page=${page}, limit=${limit}, sort=${sort}`);

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .where(eq(users.onboardingCompleted, true));
  const totalCount = totalCountResult[0]?.count ?? 0;

  // Determine sort order
  let orderByClause;
  switch (sort) {
    case "featured":
      orderByClause = [desc(projects.featured), desc(projects.createdAt)];
      break;
    case "name":
      orderByClause = [asc(projects.name)];
      break;
    case "random":
      orderByClause = [sql`random()`];
      break;
    case "recent":
    default:
      orderByClause = [desc(projects.createdAt)];
      break;
  }

  // Get paginated results
  const offset = (page - 1) * limit;
  const results = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      slug: projects.slug,
      name: projects.name,
      url: projects.url,
      githubUrl: projects.githubUrl,
      oneliner: projects.oneliner,
      description: projects.description,
      media: projects.media,
      featured: projects.featured,
      createdAt: projects.createdAt,
      ownerHandle: profiles.handle,
      ownerDisplayName: profiles.displayName,
      ownerProfileImage: profiles.profileImage,
      ownerUserImage: users.image,
    })
    .from(projects)
    .leftJoin(profiles, eq(projects.userId, profiles.userId))
    .leftJoin(users, eq(projects.userId, users.id))
    .where(eq(users.onboardingCompleted, true))
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  const projectResults: ProjectSearchResult[] = results.map((project) => ({
    id: project.id,
    userId: project.userId,
    slug: project.slug,
    name: project.name,
    url: project.url,
    githubUrl: project.githubUrl,
    oneliner: project.oneliner,
    description: project.description,
    media: project.media,
    featured: project.featured,
    createdAt: project.createdAt,
    ownerHandle: project.ownerHandle,
    ownerDisplayName: project.ownerDisplayName,
    ownerProfileImage: project.ownerProfileImage,
    ownerUserImage: project.ownerUserImage,
  }));

  console.log(
    `📊 Browse returning ${projectResults.length}/${totalCount} projects`,
  );

  return {
    results: projectResults,
    totalCount,
  };
}

/**
 * Sort project results
 */
function sortProjectResults(
  results: ProjectSearchResult[],
  sort: string,
): ProjectSearchResult[] {
  switch (sort) {
    case "featured":
      return [...results].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    case "name":
      return [...results].sort((a, b) => a.name.localeCompare(b.name));
    case "random":
      const shuffled = [...results];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    case "recent":
    default:
      return [...results].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
