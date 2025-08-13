"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveVibeAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import posthog from "posthog-js";

const VIBE_OPTIONS = [
  "Ship-first",
  "Benchmarker",
  "Agent Wrangler",
  "Eval Enjoyer",
  "Infra Minimalist",
  "Paper-to-Prototype",
  "R1 Whisperer",
  "Realtime Wizard",
];

interface VibeStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VibeStep({ onNext, onBack }: VibeStepProps) {
  const [vibes, setVibes] = useState<string[]>([]);
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    setVibes((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
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
        <h1 className="text-2xl font-semibold">What&apos;s your vibe?</h1>
        <p className="text-muted-foreground mt-2">
          Pick tags that describe your coding style
        </p>
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
            Or describe your vibe in one line
          </label>
          <Input
            id="free-vibe"
            value={free}
            onChange={(e) => setFree(e.target.value)}
            placeholder="I debug with console.log and ship on Fridays"
          />
        </div>

        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg">🦆</span>
            <span>
              <strong>Heads up!</strong> PacDuck will clean up and structure your 
              responses to keep them professional and consistent. Your unique voice 
              will be preserved while making everything community-friendly.
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
