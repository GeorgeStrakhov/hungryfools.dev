"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveExpertiseAction } from "@/app/onboarding/actions";
import { toast } from "sonner";

const OTHER = [
  "Musician",
  "Producer",
  "Teacher",
  "Writer",
  "Speaker",
  "Designer",
  "PM",
  "Founder",
  "Climber",
  "Runner",
  "Cyclist",
  "Gamer",
  "Photographer",
];

export default function ExpertiseStep() {
  const router = useRouter();
  const params = useSearchParams();
  const handle = params.get("handle") || "";
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const add = (v: string) => {
    const k = v.toLowerCase();
    setTags((s) => (s.includes(k) ? s : [...s, k]));
  };
  const remove = (v: string) => setTags((s) => s.filter((x) => x !== v));

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        setSaving(true);
        await saveExpertiseAction({ expertise: tags });
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [tags]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Beyond code, what are you great at?</h1>
      <div className="flex flex-wrap gap-2">
        {OTHER.map((v) => (
          <button key={v} className={`px-3 py-2 rounded-full border text-sm ${tags.includes(v.toLowerCase()) ? "bg-accent" : ""}`} onClick={() => add(v)}>
            {v}
          </button>
        ))}
      </div>
      <Input
        placeholder="Add your own (press Enter)"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = (e.target as HTMLInputElement).value;
            if (value) add(value);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((s) => (
          <span key={s} className="px-2 py-1 rounded bg-accent text-sm">
            {s}
            <button className="ml-2" onClick={() => remove(s)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              setSaving(true);
              await saveExpertiseAction({ expertise: tags });
              router.push(`/onboarding/showcase?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              toast.error("Could not save. Try again.");
            } finally {
              setSaving(false);
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/onboarding/stack?handle=${encodeURIComponent(handle)}`)}>Back</Button>
      </div>
    </div>
  );
}


