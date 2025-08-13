"use client";

import { useState } from "react";

type ModerationConstraint = "no-urls" | "no-profanity" | "professional-only" | "no-ads" | "no-personal-info";

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

  const moderate = async (options: ModerationOptions): Promise<ModerationResult> => {
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
      const errorMessage = err instanceof Error ? err.message : "Moderation failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { moderate, isLoading, error };
}

// Helper function for direct moderation calls
export async function moderateText(options: ModerationOptions): Promise<ModerationResult> {
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
export async function validateStep(text: string, context: string, maxLength?: number): Promise<void> {
  const result = await moderateText({
    text,
    context,
    maxLength,
    constraints: ["no-ads", "professional-only"]
  });

  if (!result.allowed) {
    const error = new Error(result.reason || "Content not allowed");
    error.name = "ModerationError";
    throw error;
  }
}