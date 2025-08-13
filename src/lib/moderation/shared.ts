import * as filter from "leo-profanity";

// Initialize the profanity filter
filter.loadDictionary("en"); // English dictionary
filter.add(["retard"]); // Add custom terms if needed

/**
 * Check if text contains blocked content using a proper profanity library
 */
export function containsBlockedContent(text: string): boolean {
  return filter.check(text);
}

/**
 * Get blocked terms found in text (for debugging/logging)
 */
export function getBlockedTerms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter((word) => filter.check(word));
}

/**
 * Clean text by replacing profanity (if we want to offer suggestions)
 */
export function cleanText(text: string, replacement: string = "***"): string {
  return filter.clean(text, replacement);
}

/**
 * Shared constraint definitions used by both moderation systems
 */
export const CONSTRAINT_DEFINITIONS = {
  "no-urls": "URLs/links are not allowed",
  "no-profanity": "Profanity is not allowed",
  "professional-only": "Content must be professional and work-appropriate",
  "no-ads": "Promotional content and advertisements are not allowed",
  "no-personal-info":
    "Personal information like phone numbers, addresses should not be shared",
} as const;

export type ConstraintKey = keyof typeof CONSTRAINT_DEFINITIONS;

/**
 * Convert constraint array to human readable string
 */
export function formatConstraints(constraints: string[]): string {
  const mapped = constraints
    .map((c) =>
      Object.prototype.hasOwnProperty.call(CONSTRAINT_DEFINITIONS, c)
        ? CONSTRAINT_DEFINITIONS[c as ConstraintKey]
        : undefined,
    )
    .filter((v) => v !== undefined) as string[];
  
  return mapped.join(", ");
}

/**
 * Check for basic URL violations
 */
export function containsUrls(text: string): boolean {
  return (
    text.includes("http://") ||
    text.includes("https://") ||
    text.includes("www.")
  );
}

/**
 * Shared PacDuck error messages
 */
export const PACDUCK_MESSAGES = {
  profanity:
    "PacDuck says: QUACK! That language is way too spicy for our pond! 🦆💔",
  urls: "PacDuck says: No links in this pond! Save them for your showcase! 🦆🔗",
  length: (actual: number, max: number) =>
    `PacDuck says: *flaps wings frantically* Too many characters! ${actual} is too much, keep it under ${max} please! 🦆`,
  professional: "PacDuck says: Let's keep it professional, fellow coder! 🦆💼",
  ads: "PacDuck says: No ads in the dev pond! We're here to build, not sell! 🦆",
  personal: "PacDuck says: Careful with personal info! Keep it safe! 🦆🔒",
  generic:
    "PacDuck says: *confused quacking* Something went wrong! Try again or give me simpler text! 🦆❓",
} as const;
