/**
 * Basic text sanitization utilities without LLM processing
 * Used to clean user input while preserving their original intent and voice
 * Note: Content moderation is handled separately via the moderation system
 */

/**
 * Sanitize a single text field (basic cleaning only)
 */
export function sanitizeText(text: string, maxLength: number): string {
  return text.trim().slice(0, maxLength);
}

/**
 * Sanitize an array of strings (like tags or selections)
 */
export function sanitizeArray(arr: string[], maxItems: number): string[] {
  return arr
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Parse and sanitize comma-separated text into array
 */
export function sanitizeCommaSeparated(
  text: string,
  maxItems: number,
): string[] {
  if (!text.trim()) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Sanitize profile text fields (basic cleaning only)
 */
export function sanitizeProfileFields(input: {
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
}) {
  return {
    displayName: input.displayName
      ? sanitizeText(input.displayName, 50)
      : undefined,
    headline: input.headline ? sanitizeText(input.headline, 100) : undefined,
    bio: input.bio ? sanitizeText(input.bio, 500) : undefined,
    location: input.location ? sanitizeText(input.location, 100) : undefined,
  };
}
