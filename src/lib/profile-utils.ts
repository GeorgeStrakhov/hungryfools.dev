import slugify from "slugify";

/**
 * Field limits for profile data - single source of truth
 */
export const PROFILE_FIELD_LIMITS = {
  handle: { min: 3, max: 32 },
  displayName: { min: 1, max: 100 },
  headline: { min: 1, max: 140 },
  bio: { max: 500 },
  skills: { max: 50 }, // max number of skills
  interests: { max: 50 }, // max number of interests
  location: { max: 100 },
  vibeTags: { max: 10 }, // max number of vibe tags
} as const;

/**
 * Generate a default handle from user data
 */
export function generateDefaultHandle(
  user: { name?: string | null; email?: string | null; id: string } | null,
): string {
  if (!user) return "";

  // Try from display name first
  if (user.name) {
    const fromName = slugify(user.name, {
      lower: true,
      strict: true,
      trim: true,
    });
    if (fromName) return fromName;
  }

  // Try from email local part
  if (user.email) {
    const emailLocal = user.email.split("@")[0];
    if (emailLocal) {
      const fromEmail = slugify(emailLocal, {
        lower: true,
        strict: true,
        trim: true,
      });
      if (fromEmail) return fromEmail;
    }
  }

  // Fallback to user ID
  return `user-${user.id.slice(0, 8)}`;
}

/**
 * Slugify and validate a handle
 */
export function normalizeHandle(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Convert comma-separated string to array of normalized strings
 */
export function csvToArray(
  csv: string | undefined,
  maxItems: number = 30,
): string[] | undefined {
  if (!csv) return undefined;
  return csv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Moderation prompt for profile content
 */
export const PROFILE_MODERATION_PROMPT = `
You are moderating user profile content for a developer community platform.
- Keep content professional and appropriate for public display
- Remove spam, promotional content, inappropriate content
- Preserve the user's authentic voice while ensuring safety
- For location: normalize to "City, State/Country" format when possible
- For headlines: keep punchy and professional (max ${PROFILE_FIELD_LIMITS.headline.max} chars)
- For bio: maintain personality while removing inappropriate content (max ${PROFILE_FIELD_LIMITS.bio.max} chars)
- For display names: keep professional and recognizable (max ${PROFILE_FIELD_LIMITS.displayName.max} chars)
`.trim();
