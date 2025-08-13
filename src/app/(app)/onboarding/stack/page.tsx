"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveStackAction } from "@/app/onboarding/actions";
import { toast } from "sonner";

const CORE = ["Next.js", "TypeScript", "Python", "Go", "Rust", "Drizzle", "Postgres", "pgvector", "Edge"];
const AGENTIC = ["R1", "GPT-4.1", "GPT-4o", "Claude", "Llama", "Agents", "Realtime", "Evals"];

export default function StackStep() {
  const router = useRouter();
  const params = useSearchParams();
  const handle = params.get("handle") || "";
  const [stack, setStack] = useState<string[]>([]);
  const [free, setFree] = useState("");
  const [power, setPower] = useState("");
  const [saving, setSaving] = useState(false);

  const add = (v: string) => {
    const k = v.toLowerCase();
    setStack((s) => (s.includes(k) ? s : [...s, k]));
  };
  const remove = (v: string) => setStack((s) => s.filter((x) => x !== v));

  // Debounced autosave
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        setSaving(true);
        await saveStackAction({ stack, power });
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [stack, power]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">What do you build with?</h1>
      <div className="flex flex-wrap gap-2">
        {CORE.map((v) => (
          <button key={v} className={`px-3 py-2 rounded-full border text-sm ${stack.includes(v.toLowerCase()) ? "bg-accent" : ""}`} onClick={() => add(v)}>
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {AGENTIC.map((v) => (
          <button key={v} className={`px-3 py-2 rounded-full border text-sm ${stack.includes(v.toLowerCase()) ? "bg-accent" : ""}`} onClick={() => add(v)}>
            {v}
          </button>
        ))}
      </div>
      <Input
        placeholder="Add anything else (press Enter)"
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
        {stack.map((s) => (
          <span key={s} className="px-2 py-1 rounded bg-accent text-sm">
            {s}
            <button className="ml-2" onClick={() => remove(s)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <Input placeholder="Optional: Your superpower (e.g., ship MVPs in 48h)" value={power} onChange={(e) => setPower(e.target.value)} />
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              setSaving(true);
              await saveStackAction({ stack, power });
              router.push(`/onboarding/expertise?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              toast.error("Could not save. Try again.");
            } finally {
              setSaving(false);
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/onboarding/vibe?handle=${encodeURIComponent(handle)}`)}>Back</Button>
      </div>
    </div>
  );
}


