"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveExpertiseAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";

const OTHER = [
  "Musician",
  "Producer",
  "Teacher",
  "Writer",
  "Speaker",
  "Designer",
  "Photographer",
  "Videographer",
  "Artist",
  "Chef",
  "Athlete",
  "Gamer",
];

interface ExpertiseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function ExpertiseStep({ onNext, onBack, onSkip }: ExpertiseStepProps) {
  const [expertise, setExpertise] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [, setSaving] = useState(false);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    setExpertise((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  const addCustomSkill = async () => {
    if (customSkill.trim()) {
      try {
        // Moderate custom skill input
        await validateStep(customSkill.trim(), "expertise", 50);

        const k = customSkill.trim().toLowerCase();
        if (!expertise.includes(k)) {
          setExpertise((prev) => [...prev, k]);
        }
        setCustomSkill("");
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        if (err?.name === "ModerationError") {
          toast.error(err.message || "Content did not pass moderation");
        } else {
          toast.error("Invalid skill name");
        }
      }
    }
  };

  const handleCustomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }
  };

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        await saveExpertiseAction({ expertise });
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [expertise]);

  const handleNext = async () => {
    setSaving(true);
    try {
      await saveExpertiseAction({ expertise });
      onNext();
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Any other expertise?</h1>
        <p className="text-muted-foreground mt-2">Skills beyond coding</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {OTHER.map((skill) => (
            <Button
              key={skill}
              variant={
                expertise.includes(skill.toLowerCase()) ? "default" : "outline"
              }
              onClick={() => toggle(skill)}
              className="justify-start"
            >
              {skill}
            </Button>
          ))}
        </div>

        {expertise.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Selected:</p>
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill) => (
                <Button
                  key={skill}
                  variant="secondary"
                  size="sm"
                  onClick={() => toggle(skill)}
                >
                  {skill} ×
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="custom-skill"
            className="mb-2 block text-sm font-medium"
          >
            Add other skills
          </label>
          <div className="flex gap-2">
            <Input
              id="custom-skill"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={handleCustomKeyPress}
              placeholder="e.g., Podcasting, Consulting, Dancing..."
            />
            <Button
              type="button"
              onClick={addCustomSkill}
              disabled={!customSkill.trim()}
              variant="outline"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
