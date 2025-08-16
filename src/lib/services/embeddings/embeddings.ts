import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

// Unused function - keeping for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_ACCOUNT_ID) {
      throw new Error(
        "Missing required environment variables: CLOUDFLARE_API_KEY and CLOUDFLARE_ACCOUNT_ID",
      );
    }

    openaiClient = new OpenAI({
      apiKey: process.env.CLOUDFLARE_API_KEY,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    });
  }
  return openaiClient;
}

export interface EmbeddingOptions {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  shape: [number, number];
  model: string;
}

export interface RerankOptions {
  query: string;
  documents: string[];
  model?: string;
  topK?: number;
}

export interface RerankResult {
  index: number;
  score: number;
  text: string;
}

export interface RerankResponse {
  results: RerankResult[];
  model: string;
}

/**
 * Generate embeddings for text input using Cloudflare's BGE-M3 model
 * @param options Embedding configuration options
 * @returns Promise with embedding vectors
 */
export async function generateEmbeddings(
  options: EmbeddingOptions,
): Promise<EmbeddingResponse> {
  const { input, model = "@cf/baai/bge-m3" } = options;

  const inputs = Array.isArray(input) ? input : [input];

  if (inputs.length === 0) {
    throw new Error("Input cannot be empty");
  }

  if (inputs.some((text) => !text || text.trim().length === 0)) {
    throw new Error("Input contains empty strings");
  }

  if (!process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error(
      "Missing required environment variables: CLOUDFLARE_API_KEY and CLOUDFLARE_ACCOUNT_ID",
    );
  }

  try {
    // Use direct Cloudflare Workers AI API call instead of OpenAI wrapper
    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: inputs,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cloudflare API error (${response.status}): ${errorText}`,
      );
    }

    const result = await response.json();

    if (!result.success || !result.result?.data) {
      throw new Error(
        `Invalid response from Cloudflare API: ${JSON.stringify(result)}`,
      );
    }

    const embeddings = result.result.data;

    return {
      embeddings,
      shape: [embeddings.length, embeddings[0]?.length || 0] as [
        number,
        number,
      ],
      model,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    throw new Error("Failed to generate embeddings: Unknown error");
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns Similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find the most similar text from a list of candidates
 * @param query Query text to compare
 * @param candidates List of candidate texts
 * @param options Additional options
 * @returns Sorted list of candidates with similarity scores
 */
export async function findMostSimilar(
  query: string,
  candidates: string[],
  options?: {
    topK?: number;
    threshold?: number;
    model?: string;
  },
): Promise<Array<{ text: string; score: number; index: number }>> {
  const { topK, threshold = 0, model } = options || {};

  if (candidates.length === 0) {
    return [];
  }

  const allTexts = [query, ...candidates];

  const response = await generateEmbeddings({
    input: allTexts,
    model,
  });

  const queryEmbedding = response.embeddings[0];
  const candidateEmbeddings = response.embeddings.slice(1);

  const similarities = candidateEmbeddings.map((embedding, index) => ({
    text: candidates[index],
    score: cosineSimilarity(queryEmbedding, embedding),
    index,
  }));

  const filtered = similarities.filter((item) => item.score >= threshold);
  const sorted = filtered.sort((a, b) => b.score - a.score);

  if (topK && topK > 0) {
    return sorted.slice(0, topK);
  }

  return sorted;
}

/**
 * Batch process embeddings for large datasets
 * @param texts Array of texts to process
 * @param batchSize Number of texts to process per batch
 * @param onProgress Optional callback for progress updates
 * @returns All embeddings
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  options?: {
    batchSize?: number;
    model?: string;
    onProgress?: (processed: number, total: number) => void;
  },
): Promise<EmbeddingResponse> {
  const { batchSize = 100, model, onProgress } = options || {};

  if (texts.length === 0) {
    return {
      embeddings: [],
      shape: [0, 0],
      model: model || "@cf/baai/bge-m3",
    };
  }

  const allEmbeddings: number[][] = [];
  let dimensionSize = 0;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));

    const response = await generateEmbeddings({
      input: batch,
      model,
    });

    allEmbeddings.push(...response.embeddings);

    if (dimensionSize === 0 && response.embeddings.length > 0) {
      dimensionSize = response.embeddings[0].length;
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }
  }

  return {
    embeddings: allEmbeddings,
    shape: [allEmbeddings.length, dimensionSize] as [number, number],
    model: model || "@cf/baai/bge-m3",
  };
}

/**
 * Rerank documents based on relevance to a query using BGE Reranker
 * @param options Reranking configuration
 * @returns Promise with reranked documents sorted by relevance
 */
export async function rerankDocuments(
  options: RerankOptions,
): Promise<RerankResponse> {
  const {
    query,
    documents,
    model = "@cf/baai/bge-reranker-base",
    topK,
  } = options;

  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  if (documents.length === 0) {
    return {
      results: [],
      model,
    };
  }

  try {
    if (!process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_ACCOUNT_ID) {
      throw new Error(
        "Missing required environment variables: CLOUDFLARE_API_KEY and CLOUDFLARE_ACCOUNT_ID",
      );
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          contexts: documents.map((text) => ({ text })),
          ...(topK && { top_k: topK }),
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reranking failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.result || !data.result.response) {
      throw new Error("Invalid response format from reranker");
    }

    const responseData = data.result.response;

    if (!Array.isArray(responseData)) {
      throw new Error(
        `Invalid response format from reranker - expected array, got ${typeof responseData}`,
      );
    }

    const results: RerankResult[] = responseData.map(
      (item: { id: number; score: number }) => ({
        index: item.id,
        score: item.score,
        text: documents[item.id],
      }),
    );

    const sortedResults = results.sort((a, b) => b.score - a.score);

    if (topK && topK > 0) {
      return {
        results: sortedResults.slice(0, topK),
        model,
      };
    }

    return {
      results: sortedResults,
      model,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to rerank documents: ${error.message}`);
    }
    throw new Error("Failed to rerank documents: Unknown error");
  }
}

/**
 * Hybrid search combining embeddings and reranking for best results
 * @param query Search query
 * @param documents Documents to search through
 * @param options Configuration options
 * @returns Reranked results
 */
export async function hybridSearch(
  query: string,
  documents: string[],
  options?: {
    embeddingModel?: string;
    rerankerModel?: string;
    initialTopK?: number;
    finalTopK?: number;
    similarityThreshold?: number;
  },
): Promise<RerankResponse> {
  const {
    embeddingModel,
    rerankerModel,
    initialTopK = 20,
    finalTopK = 10,
    similarityThreshold = 0.3,
  } = options || {};

  if (documents.length === 0) {
    return {
      results: [],
      model: rerankerModel || "@cf/baai/bge-reranker-base",
    };
  }

  // Step 1: Use embeddings to get initial candidates
  const embeddingResults = await findMostSimilar(query, documents, {
    topK: Math.min(initialTopK, documents.length),
    threshold: similarityThreshold,
    model: embeddingModel,
  });

  if (embeddingResults.length === 0) {
    return {
      results: [],
      model: rerankerModel || "@cf/baai/bge-reranker-base",
    };
  }

  // Step 2: Rerank the top candidates for better accuracy
  const candidateTexts = embeddingResults.map((r) => r.text);
  const reranked = await rerankDocuments({
    query,
    documents: candidateTexts,
    model: rerankerModel,
    topK: finalTopK,
  });

  // Map back to original indices
  const results = reranked.results.map((r) => ({
    ...r,
    index: embeddingResults[r.index].index,
    text: embeddingResults[r.index].text,
  }));

  return {
    results,
    model: reranked.model,
  };
}

/**
 * Batch rerank multiple queries against the same document set
 * @param queries Array of queries
 * @param documents Documents to rank
 * @param options Configuration options
 * @returns Array of reranked results for each query
 */
export async function batchRerank(
  queries: string[],
  documents: string[],
  options?: {
    model?: string;
    topK?: number;
    onProgress?: (processed: number, total: number) => void;
  },
): Promise<RerankResponse[]> {
  const { model, topK, onProgress } = options || {};

  if (queries.length === 0 || documents.length === 0) {
    return [];
  }

  const results: RerankResponse[] = [];

  for (let i = 0; i < queries.length; i++) {
    const response = await rerankDocuments({
      query: queries[i],
      documents,
      model,
      topK,
    });

    results.push(response);

    if (onProgress) {
      onProgress(i + 1, queries.length);
    }
  }

  return results;
}
