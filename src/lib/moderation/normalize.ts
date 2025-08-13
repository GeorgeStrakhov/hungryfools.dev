import { z } from "zod";
import { answerStructured } from "@/lib/services/llm/llm";
import { containsBlockedContent } from "./shared";

function basicSanitize<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") {
      out[k] = v.trim().slice(0, 1000);
    } else if (Array.isArray(v)) {
      const arr = v
        .map((x) => (typeof x === "string" ? x.trim().toLowerCase() : x))
        .filter(Boolean);
      out[k] = Array.from(new Set(arr)).slice(0, 50);
    } else if (typeof v === "object" && v !== null) {
      out[k] = basicSanitize(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function normalizeAndModerate<
  In extends z.ZodTypeAny,
  Out extends z.ZodTypeAny,
>(payload: unknown, inputSchema: In, outputSchema: Out, systemPrompt: string) {
  // Baseline validation and sanitize
  const parsed = inputSchema.parse(payload);
  const sanitized = basicSanitize(parsed as Record<string, unknown>);

  // Hard-block check across all string fields
  const flatTexts: string[] = [];
  const collect = (val: unknown) => {
    if (typeof val === "string") flatTexts.push(val);
    else if (Array.isArray(val)) val.forEach(collect);
    else if (val && typeof val === "object")
      Object.values(val).forEach(collect);
  };
  collect(sanitized);
  if (flatTexts.some(containsBlockedContent)) {
    throw new Error("Content contains disallowed slurs or hate speech");
  }

  // If no API key, fallback to baseline mapping via output schema defaults
  if (!process.env.GROQ_API_KEY) {
    return outputSchema.parse(sanitized);
  }

  // LLM normalization with lenient moderation (allow mild profanity)
  const llmResponse = await answerStructured({
    systemPrompt: `${systemPrompt}

Moderation policy:
- Allow casual/mild profanity.
- Strictly disallow slurs, hate speech, harassment, sexual content.
- Sanitize text by replacing disallowed content with neutral wording.
- Keep outputs concise, standardized, and safe for public display.
`,
    userPrompt: JSON.stringify(sanitized),
    responseSchema: outputSchema,
    temperature: 0.2,
  });

  return llmResponse;
}
