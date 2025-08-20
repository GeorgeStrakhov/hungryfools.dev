"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";
import { VIBE_OPTIONS } from "@/lib/onboarding-options";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import React from "react";

// options centralized in lib

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
    const newVibes = vibes.includes(k)
      ? vibes.filter((x) => x !== k)
      : [...vibes, k];
    setField("vibes", newVibes);
  };

  const handleNext = async () => {
    try {
      setSaving(true);
      if (vibeText.trim()) {
        await validateStep(vibeText.trim(), "vibe-description", 140);
      }
      analytics.track(ANALYTICS_EVENTS.VIBE_COMPLETE, { vibes, vibeText });
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
        <div className="grid auto-rows-fr grid-cols-2 gap-3">
          {VIBE_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={
                vibes.includes(option.toLowerCase()) ? "default" : "outline"
              }
              onClick={() => toggle(option)}
              className="h-full items-center justify-center p-3 text-center text-xs leading-tight whitespace-normal sm:text-sm"
              title={option}
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
