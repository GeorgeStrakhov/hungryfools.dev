#!/usr/bin/env tsx
/**
 * Generate realistic test profiles for search development
 * Run with: npx tsx scripts/generate-test-profiles.ts
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

// Schema for generated profile data
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

type GeneratedProfile = z.infer<typeof GeneratedProfileSchema>;

// Profile archetypes for diversity
const PROFILE_ARCHETYPES = [
  {
    type: "ai-startup-founder",
    company: "Mastra.ai",
    location: "Berlin, Germany",
    focus: "AI workflow automation",
    interests: ["music", "climbing", "photography"],
  },
  {
    type: "ml-engineer",
    company: "OpenAI",
    location: "San Francisco, USA",
    focus: "Large language models",
    interests: ["reading", "gaming", "chess"],
  },
  {
    type: "fullstack-dev",
    company: "Vercel",
    location: "Remote",
    focus: "Next.js and serverless",
    interests: ["travel", "cooking", "cycling"],
  },
  {
    type: "ai-researcher",
    company: "Anthropic",
    location: "London, UK",
    focus: "AI safety and alignment",
    interests: ["philosophy", "writing", "hiking"],
  },
  {
    type: "indie-hacker",
    company: "Self-employed",
    location: "Amsterdam, Netherlands",
    focus: "AI-powered SaaS products",
    interests: ["surfing", "coffee", "design"],
  },
  {
    type: "devtools-engineer",
    company: "Linear",
    location: "Toronto, Canada",
    focus: "Developer productivity tools",
    interests: ["woodworking", "running", "podcasts"],
  },
  {
    type: "data-scientist",
    company: "Stripe",
    location: "Dublin, Ireland",
    focus: "ML for fraud detection",
    interests: ["football", "brewing", "gardening"],
  },
  {
    type: "platform-engineer",
    company: "Cloudflare",
    location: "Austin, USA",
    focus: "Edge computing and Workers",
    interests: ["bbq", "live music", "swimming"],
  },
  {
    type: "frontend-specialist",
    company: "Framer",
    location: "Barcelona, Spain",
    focus: "Interactive web experiences",
    interests: ["art", "dancing", "wine"],
  },
  {
    type: "backend-architect",
    company: "Supabase",
    location: "Singapore",
    focus: "Database and real-time systems",
    interests: ["diving", "food", "martial arts"],
  },
];

// Technologies pool
const TECH_STACK = {
  languages: [
    "TypeScript",
    "Python",
    "Go",
    "Rust",
    "JavaScript",
    "Java",
    "C++",
    "Swift",
  ],
  frontend: [
    "Next.js",
    "React",
    "Vue",
    "Svelte",
    "Tailwind",
    "Framer Motion",
    "Three.js",
  ],
  backend: [
    "Node.js",
    "FastAPI",
    "Django",
    "Rails",
    "Express",
    "Nest.js",
    "GraphQL",
  ],
  databases: [
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "DynamoDB",
    "Pinecone",
    "Qdrant",
  ],
  ai: [
    "OpenAI",
    "Anthropic",
    "LangChain",
    "Transformers",
    "PyTorch",
    "TensorFlow",
    "Ollama",
  ],
  cloud: ["AWS", "Vercel", "Cloudflare", "GCP", "Azure", "Fly.io", "Railway"],
  tools: [
    "Docker",
    "Kubernetes",
    "Git",
    "GitHub Actions",
    "Terraform",
    "CI/CD",
  ],
};

async function generateProfile(
  archetype: (typeof PROFILE_ARCHETYPES)[0],
  index: number,
): Promise<GeneratedProfile> {
  const systemPrompt = `You are generating a realistic developer profile for a directory of AI-first developers.
The profile should be authentic, diverse, and interesting. Make it feel like a real person with genuine interests and projects.
Important: Generate varied and creative content - avoid repetitive patterns or generic descriptions.`;

  const userPrompt = `Generate a developer profile with these characteristics:
- Type: ${archetype.type}
- Company/Work: ${archetype.company}
- Location: ${archetype.location}
- Focus area: ${archetype.focus}
- Personal interests: ${archetype.interests.join(", ")}

Requirements:
1. Create a unique, realistic name (vary ethnicities and genders)
2. Write an engaging headline (60-100 chars) that mentions their role and something unique
3. Write a compelling bio (150-300 chars) that shows personality
4. Select 5-8 relevant skills from various categories (languages, frameworks, tools)
5. Include the provided interests plus 1-2 additional ones
6. Generate 1-3 projects that align with their expertise
7. Vary availability status realistically
8. Make each project unique with different focuses (open source tools, SaaS products, experiments)

Be creative and make this person feel real and interesting. Avoid generic descriptions.`;

  const response = await answerStructured({
    systemPrompt,
    userPrompt,
    responseSchema: GeneratedProfileSchema,
    temperature: 0.8, // Higher temperature for more variety
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
  console.log("🚀 Starting test profile generation...\n");

  const numberOfProfiles = 5; // Generate 5 profiles for testing
  const successfulProfiles: string[] = [];
  const failedProfiles: string[] = [];

  for (let i = 0; i < numberOfProfiles; i++) {
    const archetype = PROFILE_ARCHETYPES[i % PROFILE_ARCHETYPES.length];
    const profileNumber = i + 1;

    try {
      console.log(
        `📝 Generating profile ${profileNumber}/${numberOfProfiles} (${archetype.type})...`,
      );

      // Generate profile data using LLM
      const generatedData = await generateProfile(archetype, i);

      // Create test user with timestamp to avoid duplicates
      const timestamp = Date.now();
      const email = `test.user${profileNumber}.${timestamp}@hungryfools.dev`;
      const userId = await createTestUser(email, generatedData.displayName);

      // Create handle from name
      const handle =
        generatedData.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20) + profileNumber;

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
          x: Math.random() > 0.5 ? `https://x.com/${handle}` : undefined,
          website: generatedData.projects[0]?.url || undefined,
        },
        showcase: true,
        createdAt: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        ), // Random date in last 90 days
        updatedAt: new Date(),
      });

      // Create projects for this user
      for (const projectData of generatedData.projects) {
        const projectId = crypto.randomUUID();
        const slug = projectData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        await db.insert(projects).values({
          id: projectId,
          userId,
          slug,
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

        // Generate project embedding
        console.log(
          `   🔸 Generating embedding for project: ${projectData.name}`,
        );
        await generateProjectEmbedding(projectId);
      }

      // Generate profile embedding
      console.log(
        `   🔸 Generating embedding for profile: ${generatedData.displayName}`,
      );
      await generateProfileEmbedding(userId);

      successfulProfiles.push(generatedData.displayName);
      console.log(
        `   ✅ Created profile: ${generatedData.displayName} (@${handle})\n`,
      );

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Failed to create profile ${profileNumber}:`, error);
      failedProfiles.push(`Profile ${profileNumber}`);
    }
  }

  console.log("\n📊 Generation Summary:");
  console.log(`✅ Successfully created: ${successfulProfiles.length} profiles`);
  if (failedProfiles.length > 0) {
    console.log(`❌ Failed: ${failedProfiles.length} profiles`);
  }

  console.log("\n🎯 Test queries to try:");
  console.log("- 'AI developers in Berlin'");
  console.log("- 'Next.js experts who like music'");
  console.log("- 'Mastra.ai developers'");
  console.log("- 'Python developers building automation'");
  console.log("- 'Engineers interested in climbing'");

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
