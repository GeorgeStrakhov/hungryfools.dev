import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { answerStructured } from "@/lib/services/llm/llm";

const moderationRequest = z.object({
  text: z.string(),
  context: z.string(), // "profile-bio", "message", "handle", etc.
  maxLength: z.number().optional(),
  constraints: z.array(z.string()).optional(), // ["no-urls", "no-profanity", "professional-only"]
});

const moderationResponse = z.object({
  allowed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(), // Human-readable reason if not allowed
  suggestedEdit: z.string().optional(), // Suggested clean version
});

// Hard-block list for immediate rejection
const HARD_BLOCKED_TERMS = [
  "nigger", "faggot", "kike", "chink", "wetback", "retard"
];

function containsHardBlock(text: string): boolean {
  const lower = text.toLowerCase();
  return HARD_BLOCKED_TERMS.some(term => lower.includes(term));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, context, maxLength, constraints = [] } = moderationRequest.parse(body);

    // Quick hard-block check
    if (containsHardBlock(text)) {
      return NextResponse.json({
        allowed: false,
        confidence: 1.0,
        reason: "PacDuck says: QUACK! That language is way too spicy for our pond! 🦆💔",
        suggestedEdit: undefined
      });
    }

    // Length check
    if (maxLength && text.length > maxLength) {
      return NextResponse.json({
        allowed: false,
        confidence: 1.0,
        reason: `PacDuck says: *flaps wings frantically* Too many characters! ${text.length} is too much, keep it under ${maxLength} please! 🦆`,
        suggestedEdit: text.slice(0, maxLength).trim()
      });
    }

    // If no API key, do basic checks only
    if (!process.env.GROQ_API_KEY) {
      const basicIssues = [];
      if (text.includes("http://") || text.includes("https://")) {
        if (constraints.includes("no-urls")) {
          basicIssues.push("PacDuck says: No links in this pond! Save them for your showcase! 🦆🔗");
        }
      }
      
      return NextResponse.json({
        allowed: basicIssues.length === 0,
        confidence: 0.7,
        reason: basicIssues.length > 0 ? basicIssues[0] : undefined,
        suggestedEdit: undefined
      });
    }

    // LLM-based moderation
    const constraintPrompts = {
      "no-urls": "URLs/links are not allowed",
      "no-profanity": "Profanity is not allowed", 
      "professional-only": "Content must be professional and work-appropriate",
      "no-ads": "Promotional content and advertisements are not allowed",
      "no-personal-info": "Personal information like phone numbers, addresses should not be shared"
    };

    const activeConstraints = constraints
      .map(c => constraintPrompts[c])
      .filter(Boolean)
      .join(", ");

    const systemPrompt = `
You are PacDuck, the fun and quirky mascot of a developer community platform. You're moderating content but with personality!

Context: ${context}
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
- "PacDuck says: *flaps wings* Too many characters! Keep it under [limit] please!"
- "PacDuck says: No ads in the dev pond! We're here to build, not sell!"
- "PacDuck says: Uh oh, naughty language detected! Let's keep it clean!"
    `.trim();

    const result = await answerStructured({
      systemPrompt,
      userPrompt: `Please moderate this text: "${text}"`,
      responseSchema: moderationResponse,
      temperature: 0.2,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { 
        allowed: false,
        confidence: 0.5,
        reason: "PacDuck says: *confused quacking* Something went wrong! Try again or give me simpler text! 🦆❓",
        suggestedEdit: undefined
      },
      { status: 500 }
    );
  }
}