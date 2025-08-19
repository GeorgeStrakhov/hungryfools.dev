"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";
// import { STACK_CORE } from "@/lib/onboarding-options";

// options centralized in lib

interface StackStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StackStep({ onNext, onBack }: StackStepProps) {
  const { data, setField } = useOnboardingWizard();
  const { stack, stackText } = data;
  const [customTech, setCustomTech] = useState("");
  const [saving, setSaving] = useState(false);

  const add = (v: string) => {
    const k = v.toLowerCase();
    if (!stack.includes(k)) {
      setField("stack", [...stack, k]);
    }
  };

  const remove = (v: string) => {
    const k = v.toLowerCase();
    setField(
      "stack",
      stack.filter((x) => x !== k),
    );
  };

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    if (stack.includes(k)) {
      remove(v);
    } else {
      add(v);
    }
  };

  const addCustomTech = async () => {
    if (customTech.trim()) {
      try {
        await validateStep(customTech.trim(), "tech-stack", 50);
        add(customTech.trim());
        setCustomTech("");
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        if (err?.name === "ModerationError") {
          toast.error(err.message || "Content did not pass moderation");
        } else {
          toast.error("Invalid technology name");
        }
      }
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTech();
    }
  };

  const handleNext = async () => {
    try {
      setSaving(true);
      if (stackText.trim()) {
        await validateStep(stackText.trim(), "power-tool", 100);
      }
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
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.stack.title}</h1>
        {STEP_CONFIG.stack.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.stack.subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {CORE.map((tech) => (
            <Button
              key={tech}
              variant={
                stack.includes(tech.toLowerCase()) ? "default" : "outline"
              }
              onClick={() => toggle(tech)}
              className="justify-start"
            >
              {tech}
            </Button>
          ))}
        </div>

        {stack.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Selected:</p>
            <div className="flex flex-wrap gap-2">
              {stack.map((tech) => (
                <Button
                  key={tech}
                  variant="secondary"
                  size="sm"
                  onClick={() => remove(tech)}
                >
                  {tech} ×
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="custom-tech"
            className="mb-2 block text-sm font-medium"
          >
            Add other technologies
          </label>
          <div className="flex gap-2">
            <Input
              id="custom-tech"
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="e.g., LlamaIndex, Ollama, Pinecone..."
            />
            <Button
              type="button"
              onClick={addCustomTech}
              disabled={!customTech.trim()}
              variant="outline"
            >
              Add
            </Button>
          </div>
        </div>

        <div>
          <label
            htmlFor="power-tool"
            className="mb-2 block text-sm font-medium"
          >
            What&apos;s your power tool/language?
          </label>
          <Input
            id="power-tool"
            value={stackText}
            onChange={(e) => setField("stackText", e.target.value)}
            placeholder="Claude Sonnet + Cursor when I need to ship MVP fast"
          />
        </div>

        <div className="bg-muted/30 border-primary/20 rounded-lg border p-4 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg">🦆</span>
            <span>
              <strong>Note:</strong> PacDuck will normalize your tech stack into
              standard terms (e.g., &quot;JS&quot; → &quot;javascript&quot;,
              &quot;React.js&quot; → &quot;react&quot;) to help with search and
              matching.
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
