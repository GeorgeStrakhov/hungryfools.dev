import { db } from "@/db";
import {
  profiles,
  profileEmbeddings,
  projects,
  projectEmbeddings,
} from "@/db/schema/profile";
// import { users } from "@/db/schema/auth";
import { eq, sql, desc, gt } from "drizzle-orm";
import { generateEmbeddings } from "@/lib/services/embeddings/embeddings";

export interface VectorSearchResult {
  id: string;
  type: "profile" | "project";
  similarity: number;
  content: string;
  // Profile-specific fields
  userId?: string;
  handle?: string;
  displayName?: string;
  headline?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  // Project-specific fields
  projectId?: string;
  projectName?: string;
  projectOneliner?: string;
  ownerHandle?: string;
}

/**
 * Perform vector similarity search on profiles
 */
export async function searchProfilesByVector(
  queryEmbedding: number[],
  options: {
    threshold?: number;
    limit?: number;
  } = {},
): Promise<VectorSearchResult[]> {
  const { threshold = 0.3, limit = 20 } = options;

  // Calculate cosine similarity: 1 - cosine_distance
  const similarity = sql<number>`1 - (${sql.raw("profile_embeddings.embedding")} <=> ${sql.placeholder("queryEmbedding")})`;

  const results = await db
    .select({
      id: profileEmbeddings.userId,
      type: sql<"profile">`'profile'`,
      similarity,
      content: profileEmbeddings.contentPreview,
      userId: profiles.userId,
      handle: profiles.handle,
      displayName: profiles.displayName,
      headline: profiles.headline,
      location: profiles.location,
      skills: profiles.skills,
      interests: profiles.interests,
    })
    .from(profileEmbeddings)
    .innerJoin(profiles, eq(profiles.userId, profileEmbeddings.userId))
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit)
    .execute({ queryEmbedding: JSON.stringify(queryEmbedding) });

  return results as VectorSearchResult[];
}

/**
 * Perform vector similarity search on projects
 */
export async function searchProjectsByVector(
  queryEmbedding: number[],
  options: {
    threshold?: number;
    limit?: number;
  } = {},
): Promise<VectorSearchResult[]> {
  const { threshold = 0.3, limit = 20 } = options;

  // Calculate cosine similarity
  const similarity = sql<number>`1 - (${sql.raw("project_embeddings.embedding")} <=> ${sql.placeholder("queryEmbedding")})`;

  const results = await db
    .select({
      id: projectEmbeddings.projectId,
      type: sql<"project">`'project'`,
      similarity,
      content: projectEmbeddings.contentPreview,
      projectId: projects.id,
      projectName: projects.name,
      projectOneliner: projects.oneliner,
      userId: projects.userId,
      ownerHandle: profiles.handle,
      ownerDisplayName: profiles.displayName,
    })
    .from(projectEmbeddings)
    .innerJoin(projects, eq(projects.id, projectEmbeddings.projectId))
    .leftJoin(profiles, eq(profiles.userId, projects.userId))
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit)
    .execute({ queryEmbedding: JSON.stringify(queryEmbedding) });

  return results.map((result) => ({
    ...result,
    handle: result.ownerHandle,
    displayName: result.ownerDisplayName,
  })) as VectorSearchResult[];
}

/**
 * Perform combined vector similarity search on both profiles and projects
 */
export async function searchByVector(
  query: string,
  options: {
    threshold?: number;
    limit?: number;
    includeProfiles?: boolean;
    includeProjects?: boolean;
  } = {},
): Promise<VectorSearchResult[]> {
  const {
    threshold = 0.3,
    limit = 20,
    includeProfiles = true,
    includeProjects = true,
  } = options;

  console.log(`Vector search for: "${query}"`);

  // Generate embedding for the query
  const embeddingResponse = await generateEmbeddings({
    input: query,
    model: "@cf/baai/bge-m3",
  });

  const queryEmbedding = embeddingResponse.embeddings[0];

  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.warn("Failed to generate query embedding");
    return [];
  }

  console.log(`Generated query embedding: ${queryEmbedding.length} dimensions`);

  // Search both profiles and projects in parallel
  const searches = [];

  if (includeProfiles) {
    searches.push(
      searchProfilesByVector(queryEmbedding, {
        threshold,
        limit: Math.ceil(limit * 0.7), // 70% profiles
      }),
    );
  }

  if (includeProjects) {
    searches.push(
      searchProjectsByVector(queryEmbedding, {
        threshold,
        limit: Math.ceil(limit * 0.3), // 30% projects
      }),
    );
  }

  const searchResults = await Promise.all(searches);
  const allResults = searchResults.flat();

  // Combine and sort by similarity
  allResults.sort((a, b) => b.similarity - a.similarity);

  console.log(
    `Vector search found ${allResults.length} results above threshold ${threshold}`,
  );

  return allResults.slice(0, limit);
}

/**
 * Search profiles with structured filters
 */
export async function searchProfilesWithFilters(
  filters: {
    locations?: string[];
    skills?: string[];
    interests?: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
  },
  options: {
    limit?: number;
  } = {},
): Promise<VectorSearchResult[]> {
  const { limit = 50 } = options;

  // For now, return empty results to avoid complex Drizzle type issues
  // TODO: Implement proper structured filtering
  console.log(
    "Structured filter search (simplified):",
    filters,
    "limit:",
    limit,
  );

  return [];
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(): Promise<{
  profileCount: number;
  projectCount: number;
  totalEmbeddings: number;
}> {
  const [profileCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profileEmbeddings);

  const [projectCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectEmbeddings);

  return {
    profileCount: profileCount?.count || 0,
    projectCount: projectCount?.count || 0,
    totalEmbeddings: (profileCount?.count || 0) + (projectCount?.count || 0),
  };
}
