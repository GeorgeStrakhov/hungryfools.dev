"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";
import { EXPERTISE_OTHER } from "@/lib/onboarding-options";

// options centralized in lib

interface ExpertiseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function ExpertiseStep({ onNext, onBack, onSkip }: ExpertiseStepProps) {
  const { data, setField } = useOnboardingWizard();
  const [expertise, setExpertise] = useState<string[]>(data.expertise || []);
  const [customSkill, setCustomSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setExpertise(data.expertise || []);
  }, [data.expertise]);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    setExpertise((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const addCustomSkill = async () => {
    if (customSkill.trim()) {
      try {
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

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Store in wizard; persist at finish
      setField("expertise", expertise);
      onNext();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.expertise.title}</h1>
        {STEP_CONFIG.expertise.subtitle && (
          <p className="text-muted-foreground mt-2">{STEP_CONFIG.expertise.subtitle}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {EXPERTISE_OTHER.map((skill) => (
            <Button
              key={skill}
              variant={expertise.includes(skill.toLowerCase()) ? "default" : "outline"}
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
                <Button key={skill} variant="secondary" size="sm" onClick={() => toggle(skill)}>
                  {skill} ×
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="custom-skill" className="mb-2 block text-sm font-medium">
            Add other skills
          </label>
          <div className="flex gap-2">
            <Input
              id="custom-skill"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="e.g., Wine Enthusiast, Rock Climbing, Film Buff..."
            />
            <Button type="button" onClick={addCustomSkill} disabled={!customSkill.trim()} variant="outline">
              Add
            </Button>
          </div>
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack} disabled={isSaving}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleSkip} disabled={isSaving}>
              Skip
            </Button>
            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving ? (
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
    </div>
  );
}
