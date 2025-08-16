import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";

// Initialize NLP pipeline
const nlp = winkNLP(model);

// BM25 scoring parameters
const BM25_K1 = 1.2;
const BM25_B = 0.75;

export interface BM25Document {
  id: string;
  content: string;
  tokens?: string[];
  tokenCount?: number;
}

export interface BM25Result {
  id: string;
  score: number;
  content: string;
}

export interface BM25Index {
  documents: Map<string, BM25Document>;
  termFreq: Map<string, Map<string, number>>; // term -> docId -> frequency
  docFreq: Map<string, number>; // term -> number of docs containing term
  docCount: number;
  avgDocLength: number;
  totalTokens: number;
}

/**
 * Create a new BM25 index
 */
export function createBM25Index(): BM25Index {
  return {
    documents: new Map(),
    termFreq: new Map(),
    docFreq: new Map(),
    docCount: 0,
    avgDocLength: 0,
    totalTokens: 0,
  };
}

/**
 * Tokenize and normalize text using wink-nlp
 */
function tokenizeText(text: string): string[] {
  const doc = nlp.readDoc(text);

  // Extract normalized tokens (lowercase, no punctuation, filter stopwords)
  const tokens = doc
    .tokens()
    .filter((token) => {
      return (
        token.out(nlp.its.type) === "word" && // Only words, not punctuation
        !token.out(nlp.its.stopWordFlag) && // No stopwords
        token.out().length > 1 // No single characters
      );
    })
    .out(nlp.its.normal); // Normalized form (lowercase)

  return tokens;
}

/**
 * Add a document to the BM25 index
 */
export function addDocumentToIndex(index: BM25Index, doc: BM25Document): void {
  // Tokenize the document
  const tokens = tokenizeText(doc.content);

  // Create document with tokens
  const indexedDoc: BM25Document = {
    ...doc,
    tokens,
    tokenCount: tokens.length,
  };

  // Add to documents map
  index.documents.set(doc.id, indexedDoc);

  // Calculate term frequencies for this document
  const termCounts = new Map<string, number>();
  for (const token of tokens) {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  }

  // Update term frequency index
  for (const [term, count] of termCounts.entries()) {
    if (!index.termFreq.has(term)) {
      index.termFreq.set(term, new Map());
    }
    index.termFreq.get(term)!.set(doc.id, count);

    // Update document frequency (number of docs containing this term)
    if (!index.docFreq.has(term)) {
      index.docFreq.set(term, 0);
    }
    index.docFreq.set(term, index.docFreq.get(term)! + 1);
  }

  // Update index statistics
  index.docCount += 1;
  index.totalTokens += tokens.length;
  index.avgDocLength = index.totalTokens / index.docCount;
}

/**
 * Build BM25 index from a collection of documents
 */
export function buildBM25Index(documents: BM25Document[]): BM25Index {
  const index = createBM25Index();

  console.log(`Building BM25 index for ${documents.length} documents...`);

  for (const doc of documents) {
    addDocumentToIndex(index, doc);
  }

  console.log(
    `BM25 index built: ${index.docCount} docs, ${index.termFreq.size} unique terms, avg doc length: ${index.avgDocLength.toFixed(2)}`,
  );

  return index;
}

/**
 * Calculate BM25 score for a document given a query
 */
function calculateBM25Score(
  index: BM25Index,
  docId: string,
  queryTerms: string[],
): number {
  const doc = index.documents.get(docId);
  if (!doc || !doc.tokenCount) return 0;

  const docLength = doc.tokenCount;
  let score = 0;

  for (const term of queryTerms) {
    const termFreqMap = index.termFreq.get(term);
    if (!termFreqMap) continue;

    const tf = termFreqMap.get(docId) || 0;
    if (tf === 0) continue;

    const df = index.docFreq.get(term) || 0;
    if (df === 0) continue;

    // IDF calculation: log((N - df + 0.5) / (df + 0.5))
    const idf = Math.log((index.docCount - df + 0.5) / (df + 0.5));

    // BM25 formula
    const numerator = tf * (BM25_K1 + 1);
    const denominator =
      tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / index.avgDocLength));

    score += idf * (numerator / denominator);
  }

  return score;
}

/**
 * Search the BM25 index with a query
 */
export function searchBM25Index(
  index: BM25Index,
  query: string,
  options: {
    topK?: number;
    minScore?: number;
  } = {},
): BM25Result[] {
  const { topK = 20, minScore = 0 } = options;

  // Tokenize query
  const queryTerms = tokenizeText(query);

  if (queryTerms.length === 0) {
    return [];
  }

  console.log(
    `BM25 search query: "${query}" -> tokens: [${queryTerms.join(", ")}]`,
  );

  // Calculate scores for all documents
  const results: BM25Result[] = [];

  for (const [docId, doc] of index.documents.entries()) {
    const score = calculateBM25Score(index, docId, queryTerms);

    if (score > minScore) {
      results.push({
        id: docId,
        score,
        content: doc.content,
      });
    }
  }

  // Sort by score (descending) and limit results
  results.sort((a, b) => b.score - a.score);

  console.log(
    `BM25 found ${results.length} results, returning top ${Math.min(topK, results.length)}`,
  );

  return results.slice(0, topK);
}

/**
 * Update a document in the BM25 index
 * Note: This is a simple implementation that removes and re-adds the document
 * For high-frequency updates, a more sophisticated approach would be needed
 */
export function updateDocumentInIndex(
  index: BM25Index,
  docId: string,
  newContent: string,
): void {
  // Remove old document if it exists
  removeDocumentFromIndex(index, docId);

  // Add updated document
  addDocumentToIndex(index, { id: docId, content: newContent });
}

/**
 * Remove a document from the BM25 index
 */
export function removeDocumentFromIndex(index: BM25Index, docId: string): void {
  const doc = index.documents.get(docId);
  if (!doc || !doc.tokens) return;

  // Update term frequencies and document frequencies
  const termCounts = new Map<string, number>();
  for (const token of doc.tokens) {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  }

  for (const [term] of termCounts.entries()) {
    // Remove this document from term frequency map
    const termFreqMap = index.termFreq.get(term);
    if (termFreqMap) {
      termFreqMap.delete(docId);

      // If no documents contain this term anymore, remove it
      if (termFreqMap.size === 0) {
        index.termFreq.delete(term);
        index.docFreq.delete(term);
      } else {
        // Decrease document frequency
        index.docFreq.set(term, index.docFreq.get(term)! - 1);
      }
    }
  }

  // Remove document and update statistics
  index.documents.delete(docId);
  index.docCount -= 1;
  index.totalTokens -= doc.tokenCount || 0;

  if (index.docCount > 0) {
    index.avgDocLength = index.totalTokens / index.docCount;
  } else {
    index.avgDocLength = 0;
  }
}

/**
 * Get index statistics
 */
export function getIndexStats(index: BM25Index): {
  docCount: number;
  termCount: number;
  avgDocLength: number;
  totalTokens: number;
} {
  return {
    docCount: index.docCount,
    termCount: index.termFreq.size,
    avgDocLength: index.avgDocLength,
    totalTokens: index.totalTokens,
  };
}
