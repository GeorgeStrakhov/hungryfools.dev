import { answerStructured } from "@/lib/services/llm/llm";
import { z } from "zod";

// Schema for parsed search query
const ParsedQuerySchema = z.object({
  // Extracted entities
  companies: z
    .array(z.string())
    .describe("Company names mentioned in the query"),
  locations: z
    .array(z.string())
    .describe("Geographic locations, cities, countries, or 'remote'"),
  skills: z
    .array(z.string())
    .describe("Technical skills, programming languages, frameworks, tools"),
  interests: z
    .array(z.string())
    .describe("Personal interests, hobbies, activities"),

  // Availability preferences
  availability: z
    .object({
      hire: z
        .boolean()
        .nullable()
        .describe("Looking for people available for hire"),
      collab: z
        .boolean()
        .nullable()
        .describe("Looking for people open to collaboration"),
      hiring: z
        .boolean()
        .nullable()
        .describe("Looking for people who are hiring"),
    })
    .describe("Availability status preferences"),

  // Hard filters (must match exactly)
  strictFilters: z
    .object({
      locations: z
        .array(z.string())
        .describe("Locations that MUST match (from 'only in X' phrases)"),
      skills: z
        .array(z.string())
        .describe("Skills that MUST match (from 'only Python' phrases)"),
      companies: z
        .array(z.string())
        .describe("Companies that MUST match (from 'only at X' phrases)"),
      availability: z
        .object({
          hire: z.boolean().nullable().describe("MUST be available for hire"),
          collab: z
            .boolean()
            .nullable()
            .describe("MUST be open to collaboration"),
          hiring: z.boolean().nullable().describe("MUST be hiring"),
        })
        .describe("Availability that MUST match"),
    })
    .describe("Strict filters that exclude non-matching results"),

  // Search intent and remaining query
  intent: z
    .enum(["find_people", "find_projects", "find_companies", "general"])
    .describe("Primary search intent"),
  freeformQuery: z
    .string()
    .describe("Remaining query text after entity extraction"),

  // Confidence and metadata
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in the parsing (0-1)"),
  originalQuery: z.string().describe("Original search query"),
});

export type ParsedQuery = z.infer<typeof ParsedQuerySchema>;

// Common entities for better parsing
const COMMON_COMPANIES = [
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
  "Google",
  "Meta",
  "Microsoft",
  "Amazon",
  "Apple",
  "Netflix",
  "Uber",
  "Airbnb",
  "GitHub",
  "GitLab",
  "Figma",
  "Notion",
  "Slack",
  "Discord",
  "Zoom",
];

const COMMON_SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Swift",
  "React",
  "Next.js",
  "Vue",
  "Svelte",
  "Node.js",
  "Django",
  "FastAPI",
  "Express",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "AI",
  "ML",
  "LLM",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "TensorFlow",
  "PyTorch",
  "Transformers",
  "OpenAI",
  "Anthropic",
  "LangChain",
];

const COMMON_LOCATIONS = [
  "Berlin",
  "Germany",
  "San Francisco",
  "USA",
  "London",
  "UK",
  "Amsterdam",
  "Netherlands",
  "Toronto",
  "Canada",
  "Remote",
  "Austin",
  "Dublin",
  "Ireland",
  "Barcelona",
  "Spain",
  "Singapore",
  "Sydney",
  "Australia",
  "Tokyo",
  "Japan",
  "Paris",
  "France",
  "Stockholm",
  "Sweden",
  "New York",
  "Los Angeles",
  "Seattle",
  "Boston",
  "Chicago",
  "Miami",
  "Europe",
  "Asia",
  "North America",
];

const COMMON_INTERESTS = [
  "music",
  "photography",
  "climbing",
  "hiking",
  "cycling",
  "running",
  "swimming",
  "cooking",
  "coffee",
  "wine",
  "travel",
  "reading",
  "writing",
  "gaming",
  "chess",
  "art",
  "design",
  "dancing",
  "surfing",
  "skiing",
  "yoga",
  "meditation",
  "podcasts",
  "philosophy",
  "science",
  "history",
  "languages",
  "volunteering",
  "open source",
];

/**
 * Parse a natural language search query to extract entities and intent
 */
export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const systemPrompt = `You are a smart search query parser for a developer directory. 
Your job is to extract structured information from natural language search queries.

Extract entities and understand intent from developer-focused search queries.
Be precise and only extract entities that are clearly mentioned or strongly implied.

Key Guidelines:
- Companies: Look for specific company names, including startups and big tech
- Locations: Cities, countries, regions, or "remote"
- Skills: Programming languages, frameworks, tools, technologies
- Interests: Hobbies, personal interests, activities
- Availability: Whether they're looking for people to hire, collaborate with, or who are hiring
- Intent: What the user is primarily looking for

IMPORTANT - Strict Filters:
Pay special attention to words like "only", "exclusively", "just", "must be" which indicate hard requirements:
- "only in Amsterdam" → strictFilters.locations: ["Amsterdam"] (MUST be in Amsterdam)
- "only Python developers" → strictFilters.skills: ["Python"] (MUST know Python)
- "exclusively remote" → strictFilters.locations: ["remote"] (MUST be remote)
- "just Next.js experts" → strictFilters.skills: ["Next.js"] (MUST know Next.js)
- "must be available for hire" → strictFilters.availability: {hire: true}

Examples:
- "AI developers in Berlin" → locations: ["Berlin"], skills: ["AI"], intent: "find_people"
- "only Next.js experts who like music" → skills: ["Next.js"], interests: ["music"], strictFilters: {skills: ["Next.js"]}, intent: "find_people"
- "mastra.ai developers available for hire" → companies: ["Mastra.ai"], availability: {hire: true}, intent: "find_people"
- "exclusively Python developers" → skills: ["Python"], strictFilters: {skills: ["Python"]}, intent: "find_people"
- "only in Amsterdam" → locations: ["Amsterdam"], strictFilters: {locations: ["Amsterdam"]}, intent: "find_people"

Common entities to recognize:
Companies: ${COMMON_COMPANIES.slice(0, 15).join(", ")}
Skills: ${COMMON_SKILLS.slice(0, 15).join(", ")}
Locations: ${COMMON_LOCATIONS.slice(0, 15).join(", ")}
Interests: ${COMMON_INTERESTS.slice(0, 15).join(", ")}`;

  const userPrompt = `Parse this search query: "${query}"

Extract all relevant entities and determine the search intent. 
Be conservative - only extract entities that are clearly present in the query.
For availability, only set flags if explicitly mentioned (e.g., "available for hire", "looking to collaborate").
Put remaining semantic content in freeformQuery for vector search.`;

  try {
    const result = await answerStructured({
      systemPrompt,
      userPrompt,
      responseSchema: ParsedQuerySchema,
      temperature: 0.1, // Low temperature for consistent parsing
    });

    // Ensure originalQuery is set
    result.originalQuery = query;

    console.log(`Query parsed: "${query}" ->`, {
      companies: result.companies,
      locations: result.locations,
      skills: result.skills,
      interests: result.interests,
      availability: result.availability,
      intent: result.intent,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    console.error("Failed to parse query:", error);

    // Fallback: return basic structure with the query as freeform
    return {
      companies: [],
      locations: [],
      skills: [],
      interests: [],
      availability: { hire: null, collab: null, hiring: null },
      strictFilters: {
        locations: [],
        skills: [],
        companies: [],
        availability: { hire: null, collab: null, hiring: null },
      },
      intent: "general",
      freeformQuery: query,
      confidence: 0.1,
      originalQuery: query,
    };
  }
}

/**
 * Build structured filters from parsed query for SQL filtering
 */
export function buildStructuredFilters(parsed: ParsedQuery): {
  locations?: string[];
  skills?: string[];
  interests?: string[];
  availability?: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  };
  strict?: {
    locations?: string[];
    skills?: string[];
    companies?: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
  };
} {
  const filters: {
    locations?: string[];
    skills?: string[];
    interests?: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
    strict?: {
      locations?: string[];
      skills?: string[];
      companies?: string[];
      availability?: {
        hire?: boolean;
        collab?: boolean;
        hiring?: boolean;
      };
    };
  } = {};

  if (parsed.locations.length > 0) {
    filters.locations = parsed.locations;
  }

  if (parsed.skills.length > 0) {
    filters.skills = parsed.skills;
  }

  if (parsed.interests.length > 0) {
    filters.interests = parsed.interests;
  }

  // Only include availability filters if explicitly set
  const availability: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  } = {};
  if (parsed.availability.hire === true) availability.hire = true;
  if (parsed.availability.collab === true) availability.collab = true;
  if (parsed.availability.hiring === true) availability.hiring = true;

  if (Object.keys(availability).length > 0) {
    filters.availability = availability;
  }

  // Add strict filters
  const strict: {
    locations?: string[];
    skills?: string[];
    companies?: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
  } = {};

  if (parsed.strictFilters.locations.length > 0) {
    strict.locations = parsed.strictFilters.locations;
  }

  if (parsed.strictFilters.skills.length > 0) {
    strict.skills = parsed.strictFilters.skills;
  }

  if (parsed.strictFilters.companies.length > 0) {
    strict.companies = parsed.strictFilters.companies;
  }

  const strictAvailability: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  } = {};

  if (parsed.strictFilters.availability.hire === true)
    strictAvailability.hire = true;
  if (parsed.strictFilters.availability.collab === true)
    strictAvailability.collab = true;
  if (parsed.strictFilters.availability.hiring === true)
    strictAvailability.hiring = true;

  if (Object.keys(strictAvailability).length > 0) {
    strict.availability = strictAvailability;
  }

  if (Object.keys(strict).length > 0) {
    filters.strict = strict;
  }

  return filters;
}

/**
 * Build semantic query for vector search from parsed query
 */
export function buildSemanticQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];

  // Include freeform query
  if (parsed.freeformQuery.trim()) {
    parts.push(parsed.freeformQuery.trim());
  }

  // Include companies (they often have semantic meaning)
  if (parsed.companies.length > 0) {
    parts.push(...parsed.companies);
  }

  // Include skills and interests for semantic matching
  if (parsed.skills.length > 0) {
    parts.push(...parsed.skills);
  }

  if (parsed.interests.length > 0) {
    parts.push(...parsed.interests);
  }

  return parts.join(" ").trim() || parsed.originalQuery;
}

/**
 * Build keyword query for BM25 search
 */
export function buildKeywordQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];

  // Include all extracted entities as keywords
  parts.push(...parsed.companies);
  parts.push(...parsed.locations);
  parts.push(...parsed.skills);
  parts.push(...parsed.interests);

  // Include freeform query
  if (parsed.freeformQuery.trim()) {
    parts.push(parsed.freeformQuery.trim());
  }

  return parts.join(" ").trim() || parsed.originalQuery;
}
