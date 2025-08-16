#!/usr/bin/env tsx
/**
 * Test Cloudflare Workers AI directly without OpenAI wrapper
 */

import "dotenv/config";

async function testCloudflareEmbeddings() {
  console.log("Testing Cloudflare Workers AI directly...\n");

  const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!CLOUDFLARE_API_KEY || !CLOUDFLARE_ACCOUNT_ID) {
    console.error("Missing CLOUDFLARE_API_KEY or CLOUDFLARE_ACCOUNT_ID");
    return;
  }

  const testText =
    "This is a test to check embedding dimensions for BGE-M3 model on Cloudflare Workers AI.";

  try {
    // Direct Cloudflare Workers AI API call
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [testText],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }

    const result = await response.json();
    console.log("✅ Direct API response:");
    console.log("Raw result:", JSON.stringify(result, null, 2));

    if (result.result && result.result.data) {
      const embeddings = result.result.data;
      if (embeddings.length > 0) {
        const firstEmbedding = embeddings[0];
        console.log(`\nFirst embedding dimensions: ${firstEmbedding.length}`);
        console.log(
          `First 10 values: ${firstEmbedding.slice(0, 10).join(", ")}`,
        );

        // Check if all zeros
        const allZeros = firstEmbedding.every((v: number) => v === 0);
        if (allZeros) {
          console.warn("⚠️  WARNING: All embedding values are zero!");
        } else {
          console.log("✅ Embedding has non-zero values");
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testCloudflareEmbeddings();
