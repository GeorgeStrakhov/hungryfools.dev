"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveVibeAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { useProfileData } from "@/lib/hooks/useProfileData";
import { createOrUpdateProfileAction } from "@/components/profile/profile.actions";
import { STEP_CONFIG } from "../_lib/steps";
import posthog from "posthog-js";

const VIBE_OPTIONS = [
  "Ship-first Vibecoder",
  "AI Agent Orchestrator",
  "Prompt Engineer",
  "Claude Code Wizard",
  "Cursor Power User",
  "Windsurf Navigator",
  "Model Fine-tuner",
  "RAG Architect",
  "Agentic Framework Builder",
  "LLM Whisperer",
  "Token Optimizer",
  "Reasoning Chain Designer",
];

interface VibeStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VibeStep({ onNext, onBack }: VibeStepProps) {
  const { profileData } = useProfileData();
  const [vibes, setVibes] = useState<string[]>([]);
  const [free, setFree] = useState("");
  const [, setSaving] = useState(false);

  // Load existing raw onboarding data on mount
  useEffect(() => {
    if (profileData) {
      if (profileData.vibeSelections) {
        setVibes(profileData.vibeSelections);
      }
      if (profileData.vibeText) {
        setFree(profileData.vibeText);
      }
    }
  }, [profileData]);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    setVibes((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  // Debounced autosave - save both raw data and process with LLM
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        // Save raw data for state persistence
        await createOrUpdateProfileAction({
          vibeSelections: vibes,
          vibeText: free,
        });
        // Also process with LLM for headline
        await saveVibeAction({ vibes, oneLine: free });
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [vibes, free]);

  const handleNext = async () => {
    setSaving(true);
    try {
      // Moderate free text vibe input if provided
      if (free.trim()) {
        await validateStep(free.trim(), "vibe-description", 140);
      }

      posthog.capture("vibe_complete", { vibes, free });

      // Save both raw data and process with LLM
      await createOrUpdateProfileAction({
        vibeSelections: vibes,
        vibeText: free,
      });
      await saveVibeAction({ vibes, oneLine: free });

      onNext();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === "ModerationError") {
        toast.error(err.message || "Content did not pass moderation");
      } else {
        toast.error("Could not save. Try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.vibe.title}</h1>
        {STEP_CONFIG.vibe.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.vibe.subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {VIBE_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={
                vibes.includes(option.toLowerCase()) ? "default" : "outline"
              }
              onClick={() => toggle(option)}
              className="justify-start"
            >
              {option}
            </Button>
          ))}
        </div>

        <div>
          <label htmlFor="free-vibe" className="mb-2 block text-sm font-medium">
            Add more details (optional)
          </label>
          <Input
            id="free-vibe"
            value={free}
            onChange={(e) => setFree(e.target.value)}
            placeholder="e.g., I focus on early-stage prototypes and MVPs"
          />
        </div>

        <div className="bg-muted/30 border-primary/20 rounded-lg border p-4 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg">🦆</span>
            <span>
              <strong>Heads up!</strong> PacDuck will clean up and structure
              your responses to keep them professional and consistent. Your
              unique voice will be preserved while making everything
              community-friendly.
            </span>
          </p>
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}
