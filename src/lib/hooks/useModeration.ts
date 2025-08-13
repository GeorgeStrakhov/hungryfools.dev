"use client";

import { useState } from "react";

type ModerationConstraint =
  | "no-urls"
  | "no-profanity"
  | "professional-only"
  | "no-ads"
  | "no-personal-info";

interface ModerationOptions {
  text: string;
  context: string;
  maxLength?: number;
  constraints?: ModerationConstraint[];
}

interface ModerationResult {
  allowed: boolean;
  confidence: number;
  reason?: string;
  suggestedEdit?: string;
}

interface UseModerationResult {
  moderate: (options: ModerationOptions) => Promise<ModerationResult>;
  isLoading: boolean;
  error: string | null;
}

export function useModeration(): UseModerationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderate = async (
    options: ModerationOptions,
  ): Promise<ModerationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error("Moderation failed");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Moderation failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { moderate, isLoading, error };
}

// Helper function for direct moderation calls
export async function moderateText(
  options: ModerationOptions,
): Promise<ModerationResult> {
  const response = await fetch("/api/moderate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error("Moderation failed");
  }

  return await response.json();
}

// Convenience function for onboarding steps
export async function validateStep(
  text: string,
  context: string,
  maxLength?: number,
): Promise<void> {
  const result = await moderateText({
    text,
    context,
    maxLength,
    constraints: ["no-ads", "professional-only"],
  });

  if (!result.allowed) {
    const error = new Error(result.reason || "Content not allowed");
    error.name = "ModerationError";
    throw error;
  }
}

// Client-side batch validation function
export async function validateFieldsClient(
  fields: Array<{ text: string; context: string; maxLength?: number }>,
  constraints: string[] = ["no-ads", "professional-only"],
): Promise<void> {
  // Filter out empty fields
  const nonEmptyFields = fields.filter((f) => f.text.trim() !== "");

  if (nonEmptyFields.length === 0) {
    return; // Nothing to validate
  }

  if (nonEmptyFields.length === 1) {
    // Use single validation for single field
    const field = nonEmptyFields[0];
    return await validateStep(field.text, field.context, field.maxLength);
  }

  // Use batch validation for multiple fields
  const response = await fetch("/api/moderate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: nonEmptyFields,
      constraints,
    }),
  });

  if (!response.ok) {
    throw new Error("Moderation failed");
  }

  const result = await response.json();

  if (!result.allowed) {
    const error = new Error(result.reason || "Content not allowed");
    error.name = "ModerationError";
    throw error;
  }
}
