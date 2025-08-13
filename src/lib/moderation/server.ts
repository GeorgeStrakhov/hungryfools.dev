// Server-side moderation utilities
import { 
  containsBlockedContent, 
  containsUrls, 
  formatConstraints,
  PACDUCK_MESSAGES 
} from "./shared";
import { answerStructured } from "@/lib/services/llm/llm";
import { z } from "zod";

interface ValidationField {
  text: string;
  context: string;
  maxLength?: number;
}

const moderationResponse = z.object({
  allowed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(),
});

/**
 * Server-side batch validation function
 */
export async function validateFields(
  fields: ValidationField[],
  constraints: string[] = ["no-ads", "professional-only"]
): Promise<void> {
  // Filter out empty fields
  const nonEmptyFields = fields.filter(f => f.text.trim() !== "");
  
  if (nonEmptyFields.length === 0) {
    return; // Nothing to validate
  }

  // Quick checks on all fields
  for (const field of nonEmptyFields) {
    if (containsBlockedContent(field.text)) {
      const error = new Error(PACDUCK_MESSAGES.profanity);
      error.name = "ModerationError";
      throw error;
    }

    if (field.maxLength && field.text.length > field.maxLength) {
      const error = new Error(PACDUCK_MESSAGES.length(field.text.length, field.maxLength));
      error.name = "ModerationError";
      throw error;
    }
  }

  // If no API key, do basic checks only
  if (!process.env.GROQ_API_KEY) {
    for (const field of nonEmptyFields) {
      if (containsUrls(field.text)) {
        if (constraints.includes("no-urls")) {
          const error = new Error(PACDUCK_MESSAGES.urls);
          error.name = "ModerationError";
          throw error;
        }
      }
    }
    return; // All basic checks passed
  }

  // LLM moderation for multiple fields
  const activeConstraints = formatConstraints(constraints);
  
  const systemPrompt = `
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

  const fieldsText = nonEmptyFields.map(f => `${f.context}: "${f.text}"`).join('\n');
  const userPrompt = `Please moderate these fields:\n${fieldsText}`;

  const result = await answerStructured({
    systemPrompt,
    userPrompt,
    responseSchema: moderationResponse,
    temperature: 0.2,
  });

  if (!result.allowed) {
    const error = new Error(result.reason || "Content not allowed");
    error.name = "ModerationError";
    throw error;
  }
}