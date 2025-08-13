"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveStackAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";

const CORE = [
  "Next.js",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "React",
  "Node.js",
  "PostgreSQL",
  "AWS",
  "Docker",
  "GraphQL",
  "TailwindCSS",
];

interface StackStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StackStep({ onNext, onBack }: StackStepProps) {
  const [stack, setStack] = useState<string[]>([]);
  const [power, setPower] = useState("");
  const [customTech, setCustomTech] = useState("");
  const [, setSaving] = useState(false);

  const add = (v: string) => {
    const k = v.toLowerCase();
    if (!stack.includes(k)) {
      setStack((prev) => [...prev, k]);
    }
  };

  const remove = (v: string) => {
    const k = v.toLowerCase();
    setStack((prev) => prev.filter((x) => x !== k));
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
        // Moderate custom tech input
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

  const handleCustomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTech();
    }
  };

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        await saveStackAction({ stack, power });
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [stack, power]);

  const handleNext = async () => {
    setSaving(true);
    try {
      // Moderate power tool input if provided
      if (power.trim()) {
        await validateStep(power.trim(), "power-tool", 100);
      }

      await saveStackAction({ stack, power });
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
        <h1 className="text-2xl font-semibold">What&apos;s your stack?</h1>
        <p className="text-muted-foreground mt-2">
          Technologies you love working with
        </p>
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
              onKeyPress={handleCustomKeyPress}
              placeholder="e.g., Vue.js, Laravel, Redis..."
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
            value={power}
            onChange={(e) => setPower(e.target.value)}
            placeholder="The one you reach for when you need to ship fast"
          />
        </div>

        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg">🦆</span>
            <span>
              <strong>Note:</strong> PacDuck will normalize your tech stack into 
              standard terms (e.g., "JS" → "javascript", "React.js" → "react") to 
              help with search and matching.
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
