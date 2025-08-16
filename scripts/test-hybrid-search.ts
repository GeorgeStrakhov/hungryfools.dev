#!/usr/bin/env tsx
/**
 * Test the hybrid search implementation
 * Run with: npx tsx scripts/test-hybrid-search.ts
 */

import "dotenv/config";
import {
  hybridSearch,
  initializeSearch,
} from "@/lib/services/search/hybrid-search";
import { getEmbeddingStats } from "@/lib/services/search/vector-search";

// Test queries to validate different search capabilities
const TEST_QUERIES = [
  // Location-based searches
  "AI developers in Berlin",
  "developers in San Francisco",
  "remote developers",

  // Skill-based searches
  "Next.js experts",
  "Python developers",
  "machine learning engineers",
  "TypeScript developers",

  // Interest-based searches
  "developers who like music",
  "engineers interested in photography",
  "developers who enjoy climbing",

  // Company-based searches
  "Mastra.ai developers",
  "OpenAI engineers",
  "Anthropic researchers",

  // Complex combined searches
  "Next.js experts who like music",
  "AI developers in Berlin who are available for hire",
  "Python developers building automation tools",
  "machine learning engineers interested in photography",

  // Availability searches
  "developers available for hire",
  "engineers open to collaboration",

  // Project-focused searches
  "workflow automation projects",
  "AI tools and applications",
  "web development projects",
];

async function testSearch(query: string): Promise<void> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔍 Testing: "${query}"`);
  console.log(`${"=".repeat(80)}`);

  try {
    const result = await hybridSearch(query, {
      maxResults: 10,
      enableReranking: true,
      includeProjects: true,
    });

    console.log(`\n📊 Search Results (${result.results.length} found):`);
    console.log(`⏱️  Timing:`, result.timing);
    console.log(`🧠 Parsed Query:`, {
      intent: result.parsedQuery.intent,
      companies: result.parsedQuery.companies,
      locations: result.parsedQuery.locations,
      skills: result.parsedQuery.skills,
      interests: result.parsedQuery.interests,
      confidence: result.parsedQuery.confidence,
    });

    console.log(`\n🎯 Top Results:`);

    result.results.slice(0, 5).forEach((item, index) => {
      console.log(
        `\n${index + 1}. ${item.type.toUpperCase()} | Score: ${item.score.toFixed(3)} | Method: ${item.searchMethod}`,
      );

      if (item.type === "profile") {
        console.log(`   👤 ${item.displayName} (@${item.handle})`);
        console.log(`   📍 ${item.location || "No location"}`);
        console.log(`   💼 ${item.headline || "No headline"}`);
        if (item.skills && item.skills.length > 0) {
          console.log(
            `   🛠️  Skills: ${item.skills.slice(0, 5).join(", ")}${item.skills.length > 5 ? "..." : ""}`,
          );
        }
        if (item.interests && item.interests.length > 0) {
          console.log(
            `   ❤️  Interests: ${item.interests.slice(0, 3).join(", ")}${item.interests.length > 3 ? "..." : ""}`,
          );
        }
      } else if (item.type === "project") {
        console.log(`   📦 ${item.projectName} (by @${item.handle})`);
        console.log(`   📝 ${item.projectOneliner || "No description"}`);
      }
    });

    // Show search method distribution
    const methodCounts = result.results.reduce(
      (acc, r) => {
        acc[r.searchMethod] = (acc[r.searchMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log(`\n📈 Search Method Distribution:`, methodCounts);
  } catch (error) {
    console.error(`❌ Search failed:`, error);
  }
}

async function main() {
  console.log("🚀 Starting hybrid search testing...\n");

  // Check embedding stats
  const stats = await getEmbeddingStats();
  console.log("📊 Embedding Statistics:", stats);

  if (stats.totalEmbeddings === 0) {
    console.log(
      "⚠️  No embeddings found. Please run the test profile generation script first.",
    );
    console.log("   Run: npx tsx scripts/generate-batch-test-profiles.ts 3");
    return;
  }

  // Initialize search system
  console.log("\n🔧 Initializing search system...");
  await initializeSearch();

  // Test a subset of queries
  const queriesToTest =
    process.argv[2] === "all" ? TEST_QUERIES : TEST_QUERIES.slice(0, 5); // Test first 5 by default

  console.log(`\n🧪 Testing ${queriesToTest.length} queries...\n`);

  for (const query of queriesToTest) {
    await testSearch(query);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(
    `\n✅ Testing completed! Tested ${queriesToTest.length} queries.`,
  );
  console.log(`\n💡 Tips:`);
  console.log(
    `   - Run with "all" argument to test all queries: npx tsx scripts/test-hybrid-search.ts all`,
  );
  console.log(
    `   - Generate more test data: npx tsx scripts/generate-batch-test-profiles.ts 5`,
  );
  console.log(`   - Check search performance in the timing results above`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
