import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { 
  generateEmbeddings, 
  findMostSimilar, 
  rerankDocuments 
} from "@/lib/services/embeddings/embeddings";

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const body = await request.json();
    const { type, input, query, documents } = body;

    switch (type) {
      case "embedding": {
        if (!input) {
          return NextResponse.json(
            { error: "Input text is required" },
            { status: 400 }
          );
        }

        const result = await generateEmbeddings({ input });
        
        return NextResponse.json({
          embedding: result.embeddings[0],
          shape: result.shape,
          model: result.model,
        });
      }

      case "similarity": {
        if (!query || !documents || !Array.isArray(documents)) {
          return NextResponse.json(
            { error: "Query and documents array are required" },
            { status: 400 }
          );
        }

        const results = await findMostSimilar(query, documents, {
          topK: 5,
          threshold: 0,
        });

        return NextResponse.json({ results });
      }

      case "rerank": {
        if (!query || !documents || !Array.isArray(documents)) {
          return NextResponse.json(
            { error: "Query and documents array are required" },
            { status: 400 }
          );
        }

        const result = await rerankDocuments({
          query,
          documents,
          topK: 5,
        });

        return NextResponse.json({ results: result.results });
      }

      default:
        return NextResponse.json(
          { error: "Invalid test type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Embeddings test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}