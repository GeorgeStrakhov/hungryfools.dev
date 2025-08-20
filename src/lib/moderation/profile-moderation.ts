/**
 * Unified server-side moderation for profile content
 * Uses the existing smart moderation system (validateFields) with profile-specific context
 */

import { validateFields } from "./server";

interface ProfileModerationInput {
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string;
  interests?: string;
}

/**
 * Moderate profile fields using the existing smart moderation system
 * Throws ModerationError if any content fails moderation
 */
export async function moderateProfileFields(
  input: ProfileModerationInput,
): Promise<void> {
  const fieldsToValidate = [];

  if (input.displayName?.trim()) {
    fieldsToValidate.push({
      text: input.displayName.trim(),
      context: "profile-display-name",
      maxLength: 200,
    });
  }

  if (input.headline?.trim()) {
    fieldsToValidate.push({
      text: input.headline.trim(),
      context: "profile-headline",
      maxLength: 500,
    });
  }

  if (input.bio?.trim()) {
    fieldsToValidate.push({
      text: input.bio.trim(),
      context: "profile-bio",
      maxLength: 2000,
    });
  }

  if (input.location?.trim()) {
    fieldsToValidate.push({
      text: input.location.trim(),
      context: "profile-location",
      maxLength: 200,
    });
  }

  if (input.skills?.trim()) {
    fieldsToValidate.push({
      text: input.skills.trim(),
      context: "profile-skills",
      maxLength: 1000,
    });
  }

  if (input.interests?.trim()) {
    fieldsToValidate.push({
      text: input.interests.trim(),
      context: "profile-interests",
      maxLength: 1000,
    });
  }

  // Only moderate if there are fields to check
  if (fieldsToValidate.length > 0) {
    await validateFields(fieldsToValidate, ["professional-only", "no-ads"]);
  }
}

/**
 * Moderate onboarding fields using the existing smart moderation system
 */
export async function moderateOnboardingFields(input: {
  vibeText?: string;
  stackText?: string;
  vibes?: string[];
  stack?: string[];
  expertise?: string[];
}): Promise<void> {
  const fieldsToValidate = [];

  if (input.vibeText?.trim()) {
    fieldsToValidate.push({
      text: input.vibeText.trim(),
      context: "vibe-description",
      maxLength: 1000,
    });
  }

  if (input.stackText?.trim()) {
    fieldsToValidate.push({
      text: input.stackText.trim(),
      context: "power-tool",
      maxLength: 500,
    });
  }

  // Moderate array content by joining
  if (input.vibes && input.vibes.length > 0) {
    fieldsToValidate.push({
      text: input.vibes.join(", "),
      context: "vibe-selections",
      maxLength: 1000,
    });
  }

  if (input.stack && input.stack.length > 0) {
    fieldsToValidate.push({
      text: input.stack.join(", "),
      context: "tech-stack",
      maxLength: 1000,
    });
  }

  if (input.expertise && input.expertise.length > 0) {
    fieldsToValidate.push({
      text: input.expertise.join(", "),
      context: "expertise",
      maxLength: 1000,
    });
  }

  // Only moderate if there are fields to check
  if (fieldsToValidate.length > 0) {
    await validateFields(fieldsToValidate, ["professional-only", "no-ads"]);
  }
}
