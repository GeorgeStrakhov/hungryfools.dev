"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveVibeAction } from "@/app/onboarding/actions";
import { toast } from "sonner";
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

export default function VibeStep() {
  const router = useRouter();
  const params = useSearchParams();
  const handle = params.get("handle") || "";
  const [vibes, setVibes] = useState<string[]>([]);
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (v: string) => {
    const k = v.toLowerCase();
    setVibes((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        setSaving(true);
        await saveVibeAction({ vibes, oneLine: free });
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [vibes, free]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">What’s your vibecoder style?</h1>
      <div className="flex flex-wrap gap-2">
        {VIBE_OPTIONS.map((v) => (
          <button
            key={v}
            className={`px-3 py-2 rounded-full border text-sm ${vibes.includes(v.toLowerCase()) ? "bg-accent" : ""}`}
            onClick={() => toggle(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <Input placeholder="One line about how you work" value={free} onChange={(e) => setFree(e.target.value)} />
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              setSaving(true);
              await saveVibeAction({ vibes, oneLine: free });
              posthog.capture("onboarding_answer", { step: "vibe" });
              router.push(`/onboarding/stack?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              toast.error("Could not save. Try again.");
            } finally {
              setSaving(false);
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/onboarding/handle?handle=${encodeURIComponent(handle)}`)}>Back</Button>
      </div>
    </div>
  );
}


