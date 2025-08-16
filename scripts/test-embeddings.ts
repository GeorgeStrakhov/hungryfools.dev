#!/usr/bin/env tsx
/**
 * Test embedding dimensions to verify correct setup
 */

import "dotenv/config";
import { generateEmbeddings } from "@/lib/services/embeddings/embeddings";

async function testEmbeddings() {
  console.log("Testing BGE-M3 embeddings...\n");

  const testText =
    "This is a test to check embedding dimensions for BGE-M3 model on Cloudflare Workers AI.";

  try {
    const response = await generateEmbeddings({
      input: testText,
      model: "@cf/baai/bge-m3",
    });

    console.log("✅ Embedding generated successfully!");
    console.log(`Model: ${response.model}`);
    console.log(`Shape: ${response.shape[0]} x ${response.shape[1]}`);
    console.log(`Dimensions: ${response.shape[1]}`);
    console.log(
      `First 10 values: ${response.embeddings[0].slice(0, 10).join(", ")}`,
    );

    // Check if all zeros (which would indicate an issue)
    const allZeros = response.embeddings[0].every((v) => v === 0);
    if (allZeros) {
      console.warn("⚠️  WARNING: All embedding values are zero!");
    }
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
  }
}

testEmbeddings();
