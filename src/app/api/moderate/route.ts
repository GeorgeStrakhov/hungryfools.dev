import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { answerStructured } from "@/lib/services/llm/llm";
import { 
  containsBlockedContent, 
  containsUrls, 
  formatConstraints,
  PACDUCK_MESSAGES 
} from "@/lib/moderation/shared";

const singleModerationRequest = z.object({
  text: z.string(),
  context: z.string(), // "profile-bio", "message", "handle", etc.
  maxLength: z.number().optional(),
  constraints: z.array(z.string()).optional(), // ["no-urls", "no-profanity", "professional-only"]
});

const batchModerationRequest = z.object({
  fields: z.array(z.object({
    text: z.string(),
    context: z.string(),
    maxLength: z.number().optional(),
  })),
  constraints: z.array(z.string()).optional(),
});

const moderationRequest = z.union([singleModerationRequest, batchModerationRequest]);

const singleModerationResponse = z.object({
  allowed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(), // Human-readable reason if not allowed
  suggestedEdit: z.string().optional(), // Suggested clean version
});

const batchModerationResponse = z.object({
  allowed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(), // Overall reason if any field failed
  fields: z.array(z.object({
    context: z.string(),
    allowed: z.boolean(),
    reason: z.string().optional(),
  })).optional(), // Details per field (only included if something failed)
});

// Using shared profanity filter

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedRequest = moderationRequest.parse(body);

    // Determine if this is a single or batch request
    const isBatch = 'fields' in parsedRequest;

    if (isBatch) {
      return await handleBatchModeration(parsedRequest);
    } else {
      return await handleSingleModeration(parsedRequest);
    }
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      {
        allowed: false,
        confidence: 0.5,
        reason:
          "PacDuck says: *confused quacking* Something went wrong! Try again or give me simpler text! 🦆❓",
        suggestedEdit: undefined,
      },
      { status: 500 },
    );
  }
}

async function handleSingleModeration(request: z.infer<typeof singleModerationRequest>) {
  const { text, context, maxLength, constraints = [] } = request;

  // Quick profanity check
  if (containsBlockedContent(text)) {
    return NextResponse.json({
      allowed: false,
      confidence: 1.0,
      reason: PACDUCK_MESSAGES.profanity,
      suggestedEdit: undefined,
    });
  }

  // Length check
  if (maxLength && text.length > maxLength) {
    return NextResponse.json({
      allowed: false,
      confidence: 1.0,
      reason: PACDUCK_MESSAGES.length(text.length, maxLength),
      suggestedEdit: text.slice(0, maxLength).trim(),
    });
  }

  // If no API key, do basic checks only
  if (!process.env.GROQ_API_KEY) {
    const basicIssues = [];
    if (containsUrls(text)) {
      if (constraints.includes("no-urls")) {
        basicIssues.push(PACDUCK_MESSAGES.urls);
      }
    }

    return NextResponse.json({
      allowed: basicIssues.length === 0,
      confidence: 0.7,
      reason: basicIssues.length > 0 ? basicIssues[0] : undefined,
      suggestedEdit: undefined,
    });
  }

  const result = await runLLMModeration([{ text, context }], constraints);
  return NextResponse.json(result);
}

async function handleBatchModeration(request: z.infer<typeof batchModerationRequest>) {
  const { fields, constraints = [] } = request;

  // Quick checks on all fields
  for (const field of fields) {
    if (containsBlockedContent(field.text)) {
      return NextResponse.json({
        allowed: false,
        confidence: 1.0,
        reason: PACDUCK_MESSAGES.profanity,
      });
    }

    if (field.maxLength && field.text.length > field.maxLength) {
      return NextResponse.json({
        allowed: false,
        confidence: 1.0,
        reason: PACDUCK_MESSAGES.length(field.text.length, field.maxLength),
      });
    }
  }

  // If no API key, do basic checks only
  if (!process.env.GROQ_API_KEY) {
    const basicIssues = [];
    for (const field of fields) {
      if (containsUrls(field.text)) {
        if (constraints.includes("no-urls")) {
          basicIssues.push(PACDUCK_MESSAGES.urls);
          break;
        }
      }
    }

    return NextResponse.json({
      allowed: basicIssues.length === 0,
      confidence: 0.7,
      reason: basicIssues.length > 0 ? basicIssues[0] : undefined,
    });
  }

  const result = await runLLMModeration(fields, constraints);
  return NextResponse.json(result);
}

async function runLLMModeration(
  fields: Array<{ text: string; context: string }>, 
  constraints: string[]
) {
  const activeConstraints = formatConstraints(constraints);

  const isBatch = fields.length > 1;
  
  let systemPrompt, userPrompt, responseSchema;

  if (isBatch) {
    systemPrompt = `
You are PacDuck, the fun and quirky mascot of a developer community platform. You're moderating multiple fields of content at once!

${activeConstraints ? `Constraints: ${activeConstraints}` : ""}

Evaluate ALL the provided fields together and determine if the overall submission should be allowed based on these guidelines:
- Allow casual, authentic expression while maintaining safety
- Block hate speech, harassment, spam, and inappropriate content
- ${constraints.includes("no-profanity") ? "Block profanity" : "Allow mild profanity in casual contexts"}
- Consider the context of each field

IMPORTANT: If ANY content is not allowed, set allowed=false and write the reason as PacDuck in a fun, friendly way:
- Start with "PacDuck says: " 
- Be playful but clear about which field(s) have issues
- Use gaming/duck metaphors where fitting
- Keep it light-hearted, not preachy

Examples:
- "PacDuck says: Your project name looks great, but that description is a bit spicy! 🦆"
- "PacDuck says: *flaps wings* The tagline needs to be more professional, fellow coder!"
    `.trim();

    const fieldsText = fields.map(f => `${f.context}: "${f.text}"`).join('\n');
    userPrompt = `Please moderate these fields:\n${fieldsText}`;
    responseSchema = batchModerationResponse;
  } else {
    const field = fields[0];
    systemPrompt = `
You are PacDuck, the fun and quirky mascot of a developer community platform. You're moderating content but with personality!

Context: ${field.context}
${activeConstraints ? `Constraints: ${activeConstraints}` : ""}

Evaluate if the content should be allowed based on these guidelines:
- Allow casual, authentic expression while maintaining safety
- Block hate speech, harassment, spam, and inappropriate content
- ${constraints.includes("no-profanity") ? "Block profanity" : "Allow mild profanity in casual contexts"}
- Consider the context (profile vs message vs comment)

IMPORTANT: If content is not allowed, write the reason as PacDuck in a fun, friendly way:
- Start with "PacDuck says: " 
- Be playful but clear about the issue
- Use gaming/duck metaphors where fitting
- Keep it light-hearted, not preachy

Examples of good PacDuck responses:
- "PacDuck says: Quack! That's a bit spicy for our pond! 🦆"
- "PacDuck says: Whoa there! Let's keep it friendly, fellow coder!"
- "PacDuck says: No ads in the dev pond! We're here to build, not sell!"
    `.trim();

    userPrompt = `Please moderate this text: "${field.text}"`;
    responseSchema = singleModerationResponse;
  }

  const result = await answerStructured({
    systemPrompt,
    userPrompt,
    responseSchema,
    temperature: 0.2,
  });

  return result;
}
