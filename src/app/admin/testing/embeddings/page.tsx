"use client";

import { useState } from "react";
import { Loader2, FlaskConical, Copy, Check } from "lucide-react";

interface EmbeddingResult {
  embedding: number[];
  shape: [number, number];
  model: string;
}

interface RerankResult {
  index: number;
  score: number;
  text: string;
}

interface SimilarityResult {
  text: string;
  score: number;
  index: number;
}

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState<"embedding" | "similarity" | "rerank">("embedding");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Embedding test state
  const [embeddingInput, setEmbeddingInput] = useState("");
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResult | null>(null);

  // Similarity test state
  const [similarityQuery, setSimilarityQuery] = useState("");
  const [similarityDocs, setSimilarityDocs] = useState("Document about machine learning\nGuide to cooking pasta\nIntroduction to web development\nMachine learning with Python\nDatabase optimization guide");
  const [similarityResults, setSimilarityResults] = useState<SimilarityResult[] | null>(null);

  // Rerank test state
  const [rerankQuery, setRerankQuery] = useState("");
  const [rerankDocs, setRerankDocs] = useState("How to optimize database queries\nBest coffee shops in town\nDatabase indexing strategies\nSQL performance tuning\nLocal restaurant reviews");
  const [rerankResults, setRerankResults] = useState<RerankResult[] | null>(null);

  const handleEmbeddingTest = async () => {
    if (!embeddingInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setEmbeddingResult(null);

    try {
      const response = await fetch("/api/admin/test-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "embedding",
          input: embeddingInput,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate embedding");
      }

      const result = await response.json();
      setEmbeddingResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimilarityTest = async () => {
    if (!similarityQuery.trim() || !similarityDocs.trim()) return;

    setIsLoading(true);
    setError(null);
    setSimilarityResults(null);

    try {
      const response = await fetch("/api/admin/test-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "similarity",
          query: similarityQuery,
          documents: similarityDocs.split("\n").filter(d => d.trim()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to find similar documents");
      }

      const result = await response.json();
      setSimilarityResults(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerankTest = async () => {
    if (!rerankQuery.trim() || !rerankDocs.trim()) return;

    setIsLoading(true);
    setError(null);
    setRerankResults(null);

    try {
      const response = await fetch("/api/admin/test-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rerank",
          query: rerankQuery,
          documents: rerankDocs.split("\n").filter(d => d.trim()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rerank documents");
      }

      const result = await response.json();
      setRerankResults(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FlaskConical className="h-8 w-8" />
          Service Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test embeddings, similarity search, and document reranking
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("embedding")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "embedding"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Embeddings
        </button>
        <button
          onClick={() => setActiveTab("similarity")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "similarity"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Similarity Search
        </button>
        <button
          onClick={() => setActiveTab("rerank")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "rerank"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reranking
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "embedding" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Text</label>
              <textarea
                value={embeddingInput}
                onChange={(e) => setEmbeddingInput(e.target.value)}
                placeholder="Enter text to generate embeddings..."
                className="w-full p-3 border rounded-lg resize-none h-32 font-mono text-sm"
              />
            </div>

            <button
              onClick={handleEmbeddingTest}
              disabled={isLoading || !embeddingInput.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Embedding"
              )}
            </button>

            {embeddingResult && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Model:</span>
                    <p className="font-mono text-sm">{embeddingResult.model}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Shape:</span>
                    <p className="font-mono text-sm">[{embeddingResult.shape.join(", ")}]</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Embedding Vector (first 10 dimensions):
                      </span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(embeddingResult.embedding))}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy Full
                      </button>
                    </div>
                    <div className="p-3 bg-muted/50 rounded font-mono text-xs overflow-x-auto">
                      [{embeddingResult.embedding.slice(0, 10).map(n => n.toFixed(4)).join(", ")}...]
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "similarity" && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Query Text</label>
                <input
                  type="text"
                  value={similarityQuery}
                  onChange={(e) => setSimilarityQuery(e.target.value)}
                  placeholder="Enter search query..."
                  className="w-full p-3 border rounded-lg font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Documents (one per line)</label>
                <textarea
                  value={similarityDocs}
                  onChange={(e) => setSimilarityDocs(e.target.value)}
                  placeholder="Enter documents to search..."
                  className="w-full p-3 border rounded-lg resize-none h-32 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSimilarityTest}
              disabled={isLoading || !similarityQuery.trim() || !similarityDocs.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Find Similar"
              )}
            </button>

            {similarityResults && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Similarity Results</h3>
                <div className="space-y-2">
                  {similarityResults.map((result, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm">{result.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: {result.score.toFixed(4)} | Original Index: {result.index}
                        </p>
                      </div>
                    </div>
                  ))}
                  {similarityResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No similar documents found</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "rerank" && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Query Text</label>
                <input
                  type="text"
                  value={rerankQuery}
                  onChange={(e) => setRerankQuery(e.target.value)}
                  placeholder="Enter search query..."
                  className="w-full p-3 border rounded-lg font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Documents (one per line)</label>
                <textarea
                  value={rerankDocs}
                  onChange={(e) => setRerankDocs(e.target.value)}
                  placeholder="Enter documents to rerank..."
                  className="w-full p-3 border rounded-lg resize-none h-32 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleRerankTest}
              disabled={isLoading || !rerankQuery.trim() || !rerankDocs.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reranking...
                </>
              ) : (
                "Rerank Documents"
              )}
            </button>

            {rerankResults && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Reranked Results</h3>
                <div className="space-y-2">
                  {rerankResults.map((result, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                      <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm">{result.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: {result.score.toFixed(4)} | Original Index: {result.index}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rerankResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}