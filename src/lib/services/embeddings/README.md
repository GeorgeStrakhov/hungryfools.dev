# Embeddings & Reranking Service Module

A comprehensive service for generating text embeddings and reranking documents using Cloudflare's BGE models (BGE-M3 for embeddings and BGE-Reranker for reranking).

## Setup

Ensure you have the following environment variables set in your `.env` file:

```bash
CLOUDFLARE_API_KEY=your_cloudflare_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## Usage

### Basic Embedding Generation

Generate embeddings for a single text:

```typescript
import { generateEmbeddings } from "@/lib/services/embeddings/embeddings";

const result = await generateEmbeddings({
  input: "I love building AI applications",
});

console.log(result);
// Output:
// {
//   embeddings: [[0.123, -0.456, ...]], // 1024-dimensional vector
//   shape: [1, 1024],
//   model: '@cf/baai/bge-m3'
// }
```

### Multiple Text Embeddings

Generate embeddings for multiple texts in one call:

```typescript
const result = await generateEmbeddings({
  input: [
    "First document about AI",
    "Second document about machine learning",
    "Third document about deep learning",
  ],
});

console.log(result.shape); // [3, 1024]
console.log(result.embeddings.length); // 3
```

### Similarity Search

Find the most similar texts from a list of candidates:

```typescript
import { findMostSimilar } from "@/lib/services/embeddings/embeddings";

const query = "How to cook pasta?";
const candidates = [
  "Recipe for spaghetti carbonara",
  "Guide to machine learning",
  "Italian cooking basics",
  "How to fix a car engine",
  "Pasta making techniques",
];

const results = await findMostSimilar(query, candidates, {
  topK: 3, // Return top 3 results
  threshold: 0.5, // Minimum similarity score
});

console.log(results);
// Output:
// [
//   { text: 'Pasta making techniques', score: 0.92, index: 4 },
//   { text: 'Recipe for spaghetti carbonara', score: 0.87, index: 0 },
//   { text: 'Italian cooking basics', score: 0.81, index: 2 }
// ]
```

### Cosine Similarity

Calculate similarity between two embedding vectors:

```typescript
import {
  generateEmbeddings,
  cosineSimilarity,
} from "@/lib/services/embeddings/embeddings";

const result = await generateEmbeddings({
  input: ["Text A", "Text B"],
});

const similarity = cosineSimilarity(result.embeddings[0], result.embeddings[1]);

console.log(`Similarity: ${similarity}`); // Value between -1 and 1
```

### Batch Processing

Process large datasets efficiently with batch processing:

```typescript
import { batchGenerateEmbeddings } from "@/lib/services/embeddings/embeddings";

const texts = [
  // ... hundreds or thousands of texts
];

const result = await batchGenerateEmbeddings(texts, {
  batchSize: 100, // Process 100 texts at a time
  onProgress: (processed, total) => {
    console.log(
      `Progress: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`,
    );
  },
});

console.log(`Generated ${result.embeddings.length} embeddings`);
```

## Reranking

### Basic Reranking

Rerank documents based on relevance to a query using the BGE-Reranker model:

```typescript
import { rerankDocuments } from "@/lib/services/embeddings/embeddings";

const query = "How to optimize database performance?";
const documents = [
  "Database indexing strategies for better performance",
  "How to make the perfect coffee",
  "SQL query optimization techniques",
  "Understanding database query execution plans",
  "Best practices for web design",
];

const result = await rerankDocuments({
  query,
  documents,
  topK: 3, // Return top 3 most relevant documents
});

console.log(result.results);
// Output:
// [
//   { index: 0, score: 0.95, text: 'Database indexing strategies for better performance' },
//   { index: 3, score: 0.92, text: 'Understanding database query execution plans' },
//   { index: 2, score: 0.89, text: 'SQL query optimization techniques' }
// ]
```

### Hybrid Search (Embeddings + Reranking)

Combine embeddings for initial retrieval with reranking for better accuracy:

```typescript
import { hybridSearch } from "@/lib/services/embeddings/embeddings";

const query = "machine learning for beginners";
const documents = [
  // ... hundreds of documents
];

// Two-stage search: embeddings first, then reranking
const results = await hybridSearch(query, documents, {
  initialTopK: 20, // Get top 20 from embeddings
  finalTopK: 5, // Rerank and return top 5
  similarityThreshold: 0.3, // Min similarity for initial retrieval
});

console.log(results.results);
// Returns the 5 most relevant documents after reranking
```

### Batch Reranking

Rerank multiple queries against the same document set:

```typescript
import { batchRerank } from "@/lib/services/embeddings/embeddings";

const queries = [
  "How to learn Python?",
  "Best practices for REST APIs",
  "Database design patterns",
];

const documents = [
  // ... shared document corpus
];

const results = await batchRerank(queries, documents, {
  topK: 5,
  onProgress: (processed, total) => {
    console.log(`Reranking progress: ${processed}/${total}`);
  },
});

// results[0] = reranked documents for 'How to learn Python?'
// results[1] = reranked documents for 'Best practices for REST APIs'
// results[2] = reranked documents for 'Database design patterns'
```

## Features

- **BGE-M3 Model**: Uses Cloudflare's BGE-M3 model for high-quality multilingual embeddings
- **BGE-Reranker**: Advanced reranking model for improved search relevance
- **Hybrid Search**: Combines embeddings and reranking for optimal results
- **Batch Processing**: Efficiently handle large datasets with configurable batch sizes
- **Similarity Search**: Built-in functions for finding similar texts
- **Cosine Similarity**: Calculate similarity scores between embeddings
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error messages for debugging
- **Progress Tracking**: Optional callbacks for monitoring batch operations

## API Reference

### generateEmbeddings(options)

Generate embeddings for text input.

#### Parameters

| Parameter | Type                 | Required | Default             | Description                     |
| --------- | -------------------- | -------- | ------------------- | ------------------------------- |
| `input`   | `string \| string[]` | Yes      | -                   | Text or array of texts to embed |
| `model`   | `string`             | No       | `'@cf/baai/bge-m3'` | Model to use for embeddings     |

#### Returns

```typescript
interface EmbeddingResponse {
  embeddings: number[][]; // Array of embedding vectors
  shape: [number, number]; // [num_texts, embedding_dimension]
  model: string; // Model used
}
```

### findMostSimilar(query, candidates, options?)

Find the most similar texts from a list of candidates.

#### Parameters

| Parameter           | Type       | Required | Default             | Description                   |
| ------------------- | ---------- | -------- | ------------------- | ----------------------------- |
| `query`             | `string`   | Yes      | -                   | Query text to compare against |
| `candidates`        | `string[]` | Yes      | -                   | List of candidate texts       |
| `options.topK`      | `number`   | No       | -                   | Return only top K results     |
| `options.threshold` | `number`   | No       | `0`                 | Minimum similarity score      |
| `options.model`     | `string`   | No       | `'@cf/baai/bge-m3'` | Model to use                  |

#### Returns

Array of objects with:

- `text`: The candidate text
- `score`: Similarity score (0 to 1)
- `index`: Original index in candidates array

### cosineSimilarity(a, b)

Calculate cosine similarity between two vectors.

#### Parameters

| Parameter | Type       | Required | Description             |
| --------- | ---------- | -------- | ----------------------- |
| `a`       | `number[]` | Yes      | First embedding vector  |
| `b`       | `number[]` | Yes      | Second embedding vector |

#### Returns

Number between -1 and 1, where:

- 1 = identical vectors
- 0 = orthogonal vectors
- -1 = opposite vectors

### batchGenerateEmbeddings(texts, options?)

Generate embeddings for large datasets in batches.

#### Parameters

| Parameter            | Type       | Required | Default             | Description               |
| -------------------- | ---------- | -------- | ------------------- | ------------------------- |
| `texts`              | `string[]` | Yes      | -                   | Array of texts to process |
| `options.batchSize`  | `number`   | No       | `100`               | Texts per batch           |
| `options.model`      | `string`   | No       | `'@cf/baai/bge-m3'` | Model to use              |
| `options.onProgress` | `function` | No       | -                   | Progress callback         |

### rerankDocuments(options)

Rerank documents based on relevance to a query.

#### Parameters

| Parameter   | Type       | Required | Default                        | Description                     |
| ----------- | ---------- | -------- | ------------------------------ | ------------------------------- |
| `query`     | `string`   | Yes      | -                              | Query to rank documents against |
| `documents` | `string[]` | Yes      | -                              | Documents to rerank             |
| `model`     | `string`   | No       | `'@cf/baai/bge-reranker-base'` | Reranker model                  |
| `topK`      | `number`   | No       | -                              | Return only top K documents     |

#### Returns

```typescript
interface RerankResponse {
  results: RerankResult[]; // Sorted by relevance score
  model: string; // Model used
}

interface RerankResult {
  index: number; // Original document index
  score: number; // Relevance score
  text: string; // Document text
}
```

### hybridSearch(query, documents, options?)

Perform two-stage search: embeddings for retrieval, reranking for precision.

#### Parameters

| Parameter                     | Type       | Required | Default                        | Description                   |
| ----------------------------- | ---------- | -------- | ------------------------------ | ----------------------------- |
| `query`                       | `string`   | Yes      | -                              | Search query                  |
| `documents`                   | `string[]` | Yes      | -                              | Documents to search           |
| `options.embeddingModel`      | `string`   | No       | `'@cf/baai/bge-m3'`            | Embedding model               |
| `options.rerankerModel`       | `string`   | No       | `'@cf/baai/bge-reranker-base'` | Reranker model                |
| `options.initialTopK`         | `number`   | No       | `20`                           | Candidates from embeddings    |
| `options.finalTopK`           | `number`   | No       | `10`                           | Final results after reranking |
| `options.similarityThreshold` | `number`   | No       | `0.3`                          | Min similarity for retrieval  |

### batchRerank(queries, documents, options?)

Rerank multiple queries against the same document corpus.

#### Parameters

| Parameter            | Type       | Required | Default                        | Description       |
| -------------------- | ---------- | -------- | ------------------------------ | ----------------- |
| `queries`            | `string[]` | Yes      | -                              | Array of queries  |
| `documents`          | `string[]` | Yes      | -                              | Documents to rank |
| `options.model`      | `string`   | No       | `'@cf/baai/bge-reranker-base'` | Reranker model    |
| `options.topK`       | `number`   | No       | -                              | Top K per query   |
| `options.onProgress` | `function` | No       | -                              | Progress callback |

## Model Information

### BGE-M3

The BGE-M3 (BAAI General Embedding) model is a state-of-the-art multilingual embedding model that:

- Supports 100+ languages
- Generates 1024-dimensional embeddings
- Optimized for semantic similarity tasks
- Excellent for cross-lingual retrieval
- Suitable for both short and long texts

### BGE-Reranker

The BGE-Reranker model provides:

- Cross-encoder architecture for precise relevance scoring
- Better accuracy than embedding similarity alone
- Optimized for reranking retrieved candidates
- Language-agnostic ranking capabilities
- Ideal for improving search quality

## Use Cases

1. **Semantic Search**: Find relevant documents based on meaning
2. **Document Clustering**: Group similar documents together
3. **Duplicate Detection**: Identify similar or duplicate content
4. **Recommendation Systems**: Find similar items based on descriptions
5. **Question Answering**: Match questions with relevant answers
6. **Cross-lingual Search**: Search across different languages
7. **Hybrid Search**: Combine fast retrieval with accurate ranking
8. **Information Retrieval**: Improve search relevance in large corpora

## Error Handling

The service provides clear error messages:

```typescript
try {
  const result = await generateEmbeddings({
    input: "", // Empty input
  });
} catch (error) {
  console.error(error.message);
  // "Input contains empty strings"
}
```

## Performance Tips

1. **Batch Processing**: Use `batchGenerateEmbeddings` for large datasets
2. **Caching**: Cache embeddings for frequently used texts
3. **Preprocessing**: Clean and normalize text before embedding
4. **Dimension Reduction**: Consider PCA/UMAP for visualization
5. **Indexing**: Use vector databases for large-scale similarity search
6. **Hybrid Search**: Use embeddings for initial retrieval (fast) and reranking for final results (accurate)
7. **Reranker Batch Size**: Keep reranker batches small (10-50 docs) for optimal latency

## Admin Testing Interface

The service includes a built-in testing interface for admins at `/admin/testing`. This provides:

- **Embeddings Testing**: Generate embeddings for any text and view the vector output
- **Similarity Search Testing**: Test finding similar documents with configurable parameters
- **Reranking Testing**: Test document reranking with relevance scores
- **Real-time Results**: See actual API responses and debug any issues

Access the testing interface by:

1. Log in as an admin user
2. Navigate to `/admin/testing`
3. Use the tabs to test different features

## Best Practices

1. **Text Preprocessing**: Remove unnecessary whitespace and normalize encoding
2. **Batch Size**: Adjust batch size based on text length and API limits
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Monitoring**: Track API usage and costs
5. **Security**: Never expose API keys in client-side code
6. **Testing**: Use the admin testing interface to validate functionality during development
