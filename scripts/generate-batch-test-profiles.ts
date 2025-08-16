#!/usr/bin/env tsx
/**
 * Generate realistic test profiles in batches for search development
 * Run with: npx tsx scripts/generate-batch-test-profiles.ts
 */

import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles, projects } from "@/db/schema/profile";
import { answerStructured } from "@/lib/services/llm/llm";
import {
  generateProfileEmbedding,
  generateProjectEmbedding,
} from "@/lib/services/embeddings/profile-embeddings";
import { z } from "zod";
import crypto from "crypto";

// Schema for batch generated profiles
const GeneratedProfileSchema = z.object({
  displayName: z.string(),
  headline: z.string(),
  bio: z.string(),
  location: z.string(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  availableForHire: z.boolean(),
  openToCollaboration: z.boolean(),
  currentlyHiring: z.boolean(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        oneliner: z.string(),
        description: z.string(),
        url: z.string().optional(),
        githubUrl: z.string().optional(),
      }),
    )
    .min(1)
    .max(3),
});

const BatchProfilesSchema = z.object({
  profiles: z.array(GeneratedProfileSchema).length(10),
});

type GeneratedProfile = z.infer<typeof GeneratedProfileSchema>;
type BatchProfiles = z.infer<typeof BatchProfilesSchema>;

// Profile archetypes for diversity
const PROFILE_ARCHETYPES = [
  "AI startup founder working on workflow automation",
  "Machine learning engineer at major tech company",
  "Full-stack developer building Next.js applications",
  "AI safety researcher focused on alignment",
  "Indie hacker creating AI-powered SaaS products",
  "DevTools engineer improving developer productivity",
  "Data scientist working on fraud detection",
  "Platform engineer building edge computing solutions",
  "Frontend specialist creating interactive experiences",
  "Backend architect designing real-time systems",
  "Computer vision researcher",
  "NLP engineer working on language models",
  "Blockchain developer building DeFi protocols",
  "Mobile app developer focusing on React Native",
  "Game developer using Unity and C#",
  "Cybersecurity engineer building defense tools",
  "Cloud architect designing scalable systems",
  "UI/UX designer who codes",
  "Technical writer and developer advocate",
  "Open source maintainer and consultant",
];

const LOCATIONS = [
  "Berlin, Germany",
  "San Francisco, USA",
  "London, UK",
  "Amsterdam, Netherlands",
  "Toronto, Canada",
  "Remote",
  "Austin, USA",
  "Dublin, Ireland",
  "Barcelona, Spain",
  "Singapore",
  "Sydney, Australia",
  "Tokyo, Japan",
  "Paris, France",
  "Stockholm, Sweden",
  "Zurich, Switzerland",
  "Tel Aviv, Israel",
  "Copenhagen, Denmark",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Vancouver, Canada",
  "Melbourne, Australia",
  "Seoul, South Korea",
];

const COMPANIES = [
  "OpenAI",
  "Anthropic",
  "Mastra.ai",
  "Vercel",
  "Stripe",
  "Linear",
  "Supabase",
  "Cloudflare",
  "Framer",
  "Replicate",
  "Hugging Face",
  "Pinecone",
  "LangChain",
  "Fly.io",
  "Railway",
  "PlanetScale",
  "Neon",
  "Upstash",
  "Clerk",
  "Auth0",
  "Figma",
  "Notion",
  "Slack",
  "Discord",
  "GitHub",
  "GitLab",
  "Sourcegraph",
];

async function generateBatchProfiles(): Promise<BatchProfiles> {
  const systemPrompt = `You are generating 10 realistic and diverse developer profiles for a directory of AI-first developers.
Each profile should be unique with varied names, ethnicities, genders, locations, and specializations.
Make them feel like real people with genuine interests and authentic projects.

IMPORTANT: 
- Use diverse names from different cultures and ethnicities
- Vary the gender distribution
- Create unique, creative project names (avoid generic terms)
- Mix different company types and locations
- Ensure each person has distinct personality and background`;

  const userPrompt = `Generate 10 diverse developer profiles with these requirements:

**Diversity Guidelines:**
- Names: Use varied first and last names from different cultures (Asian, African, European, Latin American, Middle Eastern, etc.)
- Gender: Mix of male, female, and non-binary individuals
- Locations: Select from various global tech hubs and remote
- Companies: Mix of big tech, startups, indie, and consulting
- Archetypes: Choose from: ${PROFILE_ARCHETYPES.slice(0, 10).join(", ")}

**For each profile:**
1. Create a unique, culturally diverse name
2. Write an engaging headline (60-100 chars) showing their role and specialty
3. Write a compelling bio (150-300 chars) with personality
4. Select 5-8 relevant technical skills
5. Include 3-4 personal interests (hobbies, activities, passions)
6. Choose availability status realistically
7. Generate 1-3 unique projects with creative names
8. Select location from: ${LOCATIONS.slice(0, 12).join(", ")}

Make each person feel real and interesting with unique projects and personalities.`;

  const response = await answerStructured({
    systemPrompt,
    userPrompt,
    responseSchema: BatchProfilesSchema,
    temperature: 0.9, // Higher temperature for more diversity
  });

  return response;
}

async function createTestUser(email: string, name: string): Promise<string> {
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    emailVerified: new Date(),
  });

  return userId;
}

async function main() {
  const batchSize = process.argv[2] ? parseInt(process.argv[2]) : 2; // Default to 2 batches (20 profiles)

  console.log(
    `🚀 Starting batch test profile generation (${batchSize} batches of 10)...\n`,
  );

  let totalSuccessful = 0;
  let totalFailed = 0;

  for (let batch = 1; batch <= batchSize; batch++) {
    console.log(`📦 Generating batch ${batch}/${batchSize}...`);

    try {
      // Generate 10 profiles at once
      const batchData = await generateBatchProfiles();
      console.log(
        `   ✅ Generated ${batchData.profiles.length} profiles via LLM`,
      );

      for (let i = 0; i < batchData.profiles.length; i++) {
        const generatedData = batchData.profiles[i];
        const profileNumber = (batch - 1) * 10 + i + 1;

        try {
          console.log(
            `   📝 Creating profile ${profileNumber}: ${generatedData.displayName}...`,
          );

          // Create test user with unique email
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          const email = `test42.user${profileNumber}.${timestamp}.${randomSuffix}@hungryfools.dev`;
          const userId = await createTestUser(email, generatedData.displayName);

          // Create handle from name with extra uniqueness
          const baseHandle = generatedData.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 15);
          const handle = `${baseHandle}${profileNumber}${randomSuffix}`;

          // Insert profile
          await db.insert(profiles).values({
            userId,
            handle,
            displayName: generatedData.displayName,
            headline: generatedData.headline,
            bio: generatedData.bio,
            location: generatedData.location,
            skills: generatedData.skills,
            interests: generatedData.interests,
            availability: {
              hire: generatedData.availableForHire,
              collab: generatedData.openToCollaboration,
              hiring: generatedData.currentlyHiring,
            },
            links: {
              github: `https://github.com/${handle}`,
              x: Math.random() > 0.3 ? `https://x.com/${handle}` : undefined,
              website: generatedData.projects[0]?.url || undefined,
            },
            showcase: true,
            createdAt: new Date(
              Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
            ), // Random date in last 90 days
            updatedAt: new Date(),
          });

          // Create projects for this user
          const projectIds: string[] = [];
          for (const projectData of generatedData.projects) {
            const projectId = crypto.randomUUID();
            const slug = projectData.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 50);

            await db.insert(projects).values({
              id: projectId,
              userId,
              slug: `${slug}-${randomSuffix}`, // Add suffix to avoid conflicts
              name: projectData.name,
              oneliner: projectData.oneliner,
              description: projectData.description,
              url: projectData.url || null,
              githubUrl: projectData.githubUrl || null,
              featured: Math.random() > 0.7, // 30% chance of being featured
              media: [], // No media for test profiles
              createdAt: new Date(
                Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
              ), // Random date in last 60 days
              updatedAt: new Date(),
            });

            projectIds.push(projectId);
          }

          // Generate embeddings for projects
          for (const projectId of projectIds) {
            await generateProjectEmbedding(projectId);
          }

          // Generate profile embedding
          await generateProfileEmbedding(userId);

          totalSuccessful++;
          console.log(
            `      ✅ Created: ${generatedData.displayName} (@${handle})`,
          );
        } catch (error) {
          console.error(
            `      ❌ Failed to create profile ${profileNumber}:`,
            error,
          );
          totalFailed++;
        }

        // Small delay between profiles
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`❌ Failed to generate batch ${batch}:`, error);
      totalFailed += 10;
    }

    // Delay between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n📊 Generation Summary:");
  console.log(`✅ Successfully created: ${totalSuccessful} profiles`);
  if (totalFailed > 0) {
    console.log(`❌ Failed: ${totalFailed} profiles`);
  }

  console.log("\n🎯 Test queries to try:");
  console.log("- 'AI developers in Berlin'");
  console.log("- 'Next.js experts who like music'");
  console.log("- 'Machine learning engineers'");
  console.log("- 'Python developers building automation'");
  console.log("- 'Engineers interested in photography'");

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
