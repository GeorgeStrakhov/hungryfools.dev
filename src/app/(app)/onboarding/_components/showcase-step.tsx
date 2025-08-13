"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveShowcaseAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";

interface ShowcaseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function ShowcaseStep({ onNext, onBack, onSkip }: ShowcaseStepProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [summary, setSummary] = useState("");

  const handleNext = async () => {
    if (!title.trim() && !link.trim() && !summary.trim()) {
      toast.error("Please fill in at least one field or skip this step");
      return;
    }

    try {
      // Moderate showcase inputs if provided
      if (title.trim()) {
        await validateStep(title.trim(), "showcase-title", 100);
      }
      if (summary.trim()) {
        await validateStep(summary.trim(), "showcase-summary", 300);
      }
      // Note: Link validation could be added separately if needed
      
      await saveShowcaseAction({ title, link, summary });
      onNext();
    } catch (error: any) {
      if (error?.name === "ModerationError") {
        toast.error(error.message); // Show moderation error
      } else {
        toast.error("Could not save. Try again.");
      }
    }
  };

  const handleSkip = async () => {
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">
          Brag a bit: coolest thing you vibe-shipped?
        </h1>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Link (GitHub/Live)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Textarea
          placeholder="One-liner summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
