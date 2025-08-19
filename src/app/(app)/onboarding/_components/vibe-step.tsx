"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";
import posthog from "posthog-js";
import React from "react";

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
  const { data, setField } = useOnboardingWizard();
  const { vibes, vibeText } = data;
  const [saving, setSaving] = React.useState(false);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    const newVibes = vibes.includes(k) ? vibes.filter((x) => x !== k) : [...vibes, k];
    setField("vibes", newVibes);
  };

  const handleNext = async () => {
    try {
      setSaving(true);
      if (vibeText.trim()) {
        await validateStep(vibeText.trim(), "vibe-description", 140);
      }
      posthog.capture("vibe_complete", { vibes, free: vibeText });
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
          <p className="text-muted-foreground mt-2">{STEP_CONFIG.vibe.subtitle}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {VIBE_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={vibes.includes(option.toLowerCase()) ? "default" : "outline"}
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
            value={vibeText}
            onChange={(e) => setField("vibeText", e.target.value)}
            placeholder="e.g., I focus on early-stage prototypes and MVPs"
          />
        </div>

        <div className="bg-muted/30 border-primary/20 rounded-lg border p-4 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg">🦆</span>
            <span>
              <strong>Heads up!</strong> PacDuck will clean up and structure your responses to keep
              them professional and consistent. Your unique voice will be preserved while making
              everything community-friendly.
            </span>
          </p>
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack} disabled={saving}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
