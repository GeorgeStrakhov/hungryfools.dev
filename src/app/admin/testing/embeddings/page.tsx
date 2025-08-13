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
  const [activeTab, setActiveTab] = useState<
    "embedding" | "similarity" | "rerank"
  >("embedding");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Embedding test state
  const [embeddingInput, setEmbeddingInput] = useState("");
  const [embeddingResult, setEmbeddingResult] =
    useState<EmbeddingResult | null>(null);

  // Similarity test state
  const [similarityQuery, setSimilarityQuery] = useState("");
  const [similarityDocs, setSimilarityDocs] = useState(
    "Document about machine learning\nGuide to cooking pasta\nIntroduction to web development\nMachine learning with Python\nDatabase optimization guide",
  );
  const [similarityResults, setSimilarityResults] = useState<
    SimilarityResult[] | null
  >(null);

  // Rerank test state
  const [rerankQuery, setRerankQuery] = useState("");
  const [rerankDocs, setRerankDocs] = useState(
    "How to optimize database queries\nBest coffee shops in town\nDatabase indexing strategies\nSQL performance tuning\nLocal restaurant reviews",
  );
  const [rerankResults, setRerankResults] = useState<RerankResult[] | null>(
    null,
  );

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
          documents: similarityDocs.split("\n").filter((d) => d.trim()),
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
          documents: rerankDocs.split("\n").filter((d) => d.trim()),
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
        <h1 className="flex items-center gap-2 text-3xl font-bold">
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
              ? "border-primary text-primary border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Embeddings
        </button>
        <button
          onClick={() => setActiveTab("similarity")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "similarity"
              ? "border-primary text-primary border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Similarity Search
        </button>
        <button
          onClick={() => setActiveTab("rerank")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "rerank"
              ? "border-primary text-primary border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reranking
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
              />
            </div>

            <button
              onClick={handleEmbeddingTest}
              disabled={isLoading || !embeddingInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <span className="text-muted-foreground text-sm font-medium">
                      Model:
                    </span>
                    <p className="font-mono text-sm">{embeddingResult.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm font-medium">
                      Shape:
                    </span>
                    <p className="font-mono text-sm">
                      [{embeddingResult.shape.join(", ")}]
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm font-medium">
                        Embedding Vector (first 10 dimensions):
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(embeddingResult.embedding),
                          )
                        }
                        className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1 text-xs"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy Full
                      </button>
                    </div>
                    <div className="bg-muted/50 overflow-x-auto rounded p-3 font-mono text-xs">
                      [
                      {embeddingResult.embedding
                        .slice(0, 10)
                        .map((n) => n.toFixed(4))
                        .join(", ")}
                      ...]
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
                  className="w-full rounded-lg border p-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Documents (one per line)
                </label>
                <textarea
                  value={similarityDocs}
                  onChange={(e) => setSimilarityDocs(e.target.value)}
                  placeholder="Enter documents to search..."
                  className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSimilarityTest}
              disabled={
                isLoading || !similarityQuery.trim() || !similarityDocs.trim()
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Similarity Results</h3>
                <div className="space-y-2">
                  {similarityResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 flex items-start gap-3 rounded p-3"
                    >
                      <span className="text-primary text-sm font-bold">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{result.text}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Score: {result.score.toFixed(4)} | Original Index:{" "}
                          {result.index}
                        </p>
                      </div>
                    </div>
                  ))}
                  {similarityResults.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No similar documents found
                    </p>
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
                  className="w-full rounded-lg border p-3 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Documents (one per line)
                </label>
                <textarea
                  value={rerankDocs}
                  onChange={(e) => setRerankDocs(e.target.value)}
                  placeholder="Enter documents to rerank..."
                  className="h-32 w-full resize-none rounded-lg border p-3 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleRerankTest}
              disabled={isLoading || !rerankQuery.trim() || !rerankDocs.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Reranked Results</h3>
                <div className="space-y-2">
                  {rerankResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 flex items-start gap-3 rounded p-3"
                    >
                      <span className="text-primary text-sm font-bold">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{result.text}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Score: {result.score.toFixed(4)} | Original Index:{" "}
                          {result.index}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rerankResults.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No results found
                    </p>
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
