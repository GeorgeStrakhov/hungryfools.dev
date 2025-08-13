# HungryFools.dev - Advanced Search Development Plan

## 🎯 Overview

This document outlines the development plan for implementing intelligent hybrid search on HungryFools.dev. The goal is to enable natural language queries like "mastra.ai developers in Germany who also like music" and return highly relevant results through semantic understanding and intelligent ranking.

**Key Principle**: We will not release until we have demonstrably superior search that provides real value over basic keyword matching.

## 📋 Current State Analysis

### ✅ Completed
- Stage 1: Developer profiles with projects system
- Basic keyword search over profiles and projects
- S3 media pipeline and project management
- Batch moderation system

### ⏳ Missing Critical Pieces
- Advanced filtering UI (location, skills, availability)
- Analytics infrastructure 
- Vector embeddings pipeline
- Hybrid search algorithm
- Query intelligence (text-to-SQL + NLP)
- Comprehensive test data

## 🏗️ Technical Architecture

### 1. Multi-Modal Search Pipeline

```
Natural Language Query → Query Intelligence → Multi-Modal Search → Fusion & Ranking → Results
```

#### Query Intelligence Layer
- **LLM-powered query parsing** using `/src/lib/services/llm/`
- Extract entities: companies, locations, skills, interests
- Identify search intent and context
- Generate structured filters + semantic query

#### Multi-Modal Search Layer
1. **BM25 (Keyword)**: Fast exact matching on indexed fields
2. **Vector Similarity**: Semantic search via BGE-M3 embeddings
3. **SQL Filters**: Structured data (location, availability, skills)

#### Fusion & Ranking
- Weighted score combination (BM25 + semantic + recency + completeness)
- **BGE reranking** using existing `rerankDocuments()` function
- Simple quality boosts (profile completeness, featured content)

### 2. Embedding Strategy

#### Profile Embeddings
**Content to embed**: Rich concatenated profile text
```typescript
interface ProfileEmbeddingContent {
  core: string; // "John Doe, full-stack developer and AI engineer"
  location: string; // "based in Berlin, Germany"
  skills: string; // "Skills: Next.js, TypeScript, Python, LLM, PostgreSQL"
  interests: string; // "Interests: music, photography, rock climbing"
  headline: string; // User's headline/bio
  summary: string; // Projects summary
}
```

#### Project Embeddings (Phase 2)
**Content to embed**: Project-specific rich text
```typescript
interface ProjectEmbeddingContent {
  project: string; // "Mastra.ai - AI workflow automation platform"
  description: string; // Full project description
  technologies: string; // "Built with Next.js, TypeScript, OpenAI"
  context: string; // "Created by John Doe, Berlin-based developer"
}
```

### 3. Data Model Extensions

Using existing Drizzle schema in `/src/db/schema/`:

```typescript
// Add to /src/db/schema/profile.ts
import { vector, cosineDistance, sql } from "drizzle-orm/pg-core";

export const profileEmbeddings = pgTable("profile_embeddings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // BGE-M3 produces 1024-dimensional vectors
  embedding: vector("embedding", { dimensions: 1024 }).notNull(),
  contentHash: text("contentHash").notNull(), // For incremental updates
  contentPreview: text("contentPreview").notNull(), // For debugging
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex("profile_embeddings_user_idx").on(table.userId),
  // HNSW index for fast vector similarity search
  embeddingIdx: index("profile_embeddings_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const projectEmbeddings = pgTable("project_embeddings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId").notNull(), // For joins
  embedding: vector("embedding", { dimensions: 1024 }).notNull(),
  contentHash: text("contentHash").notNull(),
  contentPreview: text("contentPreview").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdx: uniqueIndex("project_embeddings_project_idx").on(table.projectId),
}));

export const searchAnalytics = pgTable("search_analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId").notNull(),
  userId: text("userId").references(() => users.id),
  query: text("query").notNull(),
  parsedQuery: jsonb("parsedQuery"), // Structured query breakdown
  resultsCount: integer("resultsCount").notNull(),
  clickedProfiles: jsonb("clickedProfiles").$type<string[]>(), // Array of profile IDs
  searchType: text("searchType").notNull(), // 'keyword', 'hybrid', 'semantic'
  responseTimeMs: integer("responseTimeMs"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
```

## 🔧 Technical Implementation

### 1. Test Data Generation Script
Create realistic profiles to test search quality:

```typescript
// /scripts/generate-test-data.ts  
interface TestDataConfig {
  profiles: 200-500,
  projects: 400-1000,
  diversity: {
    locations: ["Berlin", "San Francisco", "London", "Amsterdam", "Toronto", "Remote"],
    companies: ["OpenAI", "Anthropic", "Mastra.ai", "Vercel", "Stripe", "Linear"],
    skills: [...tech_stack],
    interests: [...hobbies_and_interests]
  }
}

async function generateRealisticProfile(): Promise<ProfileData> {
  // Use existing /src/lib/services/llm/ to generate coherent profiles
  // Match skills with realistic projects and locations
}
```

### 2. Database Schema & Migration
Add embedding tables to existing Drizzle schema and run migration.

### 3. Profile Embedding Generation
```typescript
// /src/lib/services/embeddings/profile-embeddings.ts
export async function generateProfileEmbedding(profile: FullProfile): Promise<number[]> {
  const content = buildProfileContent(profile);
  const response = await generateEmbeddings({ input: content });
  return response.embeddings[0];
}

function buildProfileContent(profile: FullProfile): string {
  return [
    `${profile.displayName}, ${profile.headline}`,
    `Location: ${profile.location}`,
    `Skills: ${profile.skills?.join(', ')}`,
    `Interests: ${profile.interests?.join(', ')}`,
    // Include project summaries
    profile.projects?.map(p => `Project: ${p.name} - ${p.oneliner}`).join('. ')
  ].filter(Boolean).join('. ');
}
```

### 4. Query Intelligence (LLM Parser)
```typescript
// /src/lib/services/search/query-parser.ts
interface ParsedQuery {
  entities: {
    companies: string[];
    locations: string[];
    skills: string[];
    interests: string[];
  };
  freeform_query: string;
}

export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  // Use existing /src/lib/services/llm/ to extract entities
  const prompt = `Parse this search query and extract entities: "${query}"`;
  // Return structured entities + remaining freeform text
}
```

### 5. Vector Similarity Search (Drizzle)
```typescript
// /src/lib/services/search/vector-search.ts
import { cosineDistance, sql, desc, gt } from "drizzle-orm";

export async function vectorSimilaritySearch(
  queryEmbedding: number[],
  threshold: number = 0.5,
  limit: number = 20
) {
  const similarity = sql<number>`1 - (${cosineDistance(profileEmbeddings.embedding, queryEmbedding)})`;
  
  const results = await db
    .select({
      userId: profileEmbeddings.userId,
      similarity,
      // Join with profiles table for full data
      profile: profiles,
    })
    .from(profileEmbeddings)
    .innerJoin(profiles, eq(profiles.userId, profileEmbeddings.userId))
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);
    
  return results;
}

### 6. Hybrid Search Implementation  
```typescript
// /src/lib/services/search/hybrid-search.ts
export async function hybridSearch(query: string): Promise<SearchResults> {
  const parsed = await parseSearchQuery(query);
  
  // 1. Generate query embedding for vector search
  const queryEmbedding = await generateEmbeddings({ input: parsed.freeform_query });
  
  // 2. Vector similarity search
  const vectorResults = await vectorSimilaritySearch(
    queryEmbedding.embeddings[0], 
    0.3, // similarity threshold
    50   // get more candidates for reranking
  );
  
  // 3. Apply additional SQL filters from parsed entities
  const filteredResults = vectorResults.filter(result => 
    matchesEntityFilters(result.profile, parsed.entities)
  );
  
  // 4. BGE reranking for final ordering
  const documents = filteredResults.map(r => buildProfileContent(r.profile));
  const reranked = await rerankDocuments({
    query: query,
    documents: documents,
    topK: 20
  });
  
  return mapToSearchResults(reranked, filteredResults);
}
```

## 🧪 Test Queries for Validation

```typescript
const testQueries = [
  "AI developers in Berlin",
  "Next.js experts who like music", 
  "mastra.ai developers",
  "full-stack engineers",
  "ML engineers with Python experience in Germany",
  "developers working on AI automation tools",
  "TypeScript developers interested in climbing"
];
```

## 📋 Implementation Checklist

- [ ] Generate 200-500 test profiles using LLM
- [ ] Add pgvector extension to Neon
- [ ] Create embedding schema migration
- [ ] Build profile content generation function
- [ ] Implement BGE-M3 embedding pipeline
- [ ] Create LLM query parser
- [ ] Build hybrid search algorithm
- [ ] Integrate BGE reranking
- [ ] Add search to directory page
- [ ] Basic analytics tracking

**Target**: <200ms search response time with demonstrably better results than keyword-only search.