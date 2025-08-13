"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOrUpdateProfileAction } from "../profile/edit/profile.actions";
import { useSession } from "next-auth/react";

const funHeadlines = [
  "I ship MVPs before your coffee gets cold",
  "I speak LLM and JavaScript",
  "Agents, evals, and vibes",
  "I debug with R1 and vibes",
  "Realtime is my love language",
];

const options = {
  skills: [
    "Next.js",
    "TypeScript",
    "Python",
    "Go",
    "Rust",
    "Postgres",
    "pgvector",
    "Drizzle",
    "Prisma",
  ],
  agentic: [
    "R1",
    "GPT-4.1",
    "GPT-4o",
    "Llama",
    "Claude",
    "Agents",
    "Evals",
    "Realtime",
  ],
};

type Step = "purpose" | "handle" | "headline" | "skills" | "interests" | "availability" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("purpose");
  const [pending, setPending] = useState(false);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [avail, setAvail] = useState({ hire: false, collab: true, hiring: false });

  useEffect(() => {
    posthog.capture("onboarding_step_view", { step });
  }, [step]);

  const randomHeadline = useMemo(() => funHeadlines[Math.floor(Math.random() * funHeadlines.length)], []);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  // Prepopulate from GitHub session when available
  useEffect(() => {
    if (!session?.user) return;
    // display name
    if (!displayName && session.user.name) setDisplayName(session.user.name);
    // handle: prefer GitHub display name, then email local-part, then id-based
    if (!handle) {
      const candidateFromName = session.user.name ? slugify(session.user.name) : "";
      const emailLocal = (session.user as any).email?.split("@")[0] || "";
      const candidateFromEmail = emailLocal ? slugify(emailLocal) : "";
      const fallback = session.user.id ? `user-${session.user.id.slice(0, 8)}` : "";
      setHandle(candidateFromName || candidateFromEmail || fallback);
    }
    // headline placeholder default
    if (!headline) setHeadline(randomHeadline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  const addToken = (list: string[], setList: (v: string[]) => void, token: string) => {
    const cleaned = token.trim().toLowerCase();
    if (!cleaned) return;
    if (list.includes(cleaned)) return;
    setList([...list, cleaned]);
  };

  const removeToken = (list: string[], setList: (v: string[]) => void, token: string) => {
    setList(list.filter((t) => t !== token));
  };

  const submitAll = async () => {
    setPending(true);
    try {
      await createOrUpdateProfileAction({
        handle,
        displayName: displayName || handle,
        headline: headline || randomHeadline,
        skills: skills.join(", "),
        interests: interests.join(", "),
        availCollab: avail.collab,
        availHire: avail.hire,
        availHiring: avail.hiring,
      } as any);
      posthog.capture("onboarding_complete");
      router.replace("/directory");
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="hf-container py-10 max-w-2xl">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image src="/images/PacDuck.png" alt="PacDuck" width={128} height={128} priority />
        <h1 className="text-2xl font-semibold">PacDuck says welcome!</h1>
      </div>

      {step === "purpose" && (
        <div className="space-y-6">
          <p className="text-lg text-center mb-12">What are you here for, dear?</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button
              className="h-16 text-base"
              onClick={() => {
                posthog.capture("purpose_select", { choice: "list" });
                setStep("handle");
              }}
            >
              List myself as an expert vibecoder
            </Button>
            <Button
              variant="outline"
              className="h-16 text-base"
              onClick={async () => {
                posthog.capture("purpose_select", { choice: "find" });
                await createOrUpdateProfileAction({
                  // omit handle to derive from GitHub/email
                  displayName: "",
                  headline: randomHeadline,
                  availCollab: true,
                } as any);
                router.replace("/directory");
              }}
            >
              Find vibecoders to work with
            </Button>
          </div>
        </div>
      )}

      {step === "handle" && (
        <div className="space-y-4">
          <p className="text-lg">Pick your handle</p>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="your-handle" />
          <div className="flex flex-row-reverse items-center justify-between">
            <Button onClick={() => setStep("headline")}>Next</Button>
            <Button variant="ghost" onClick={() => setStep("purpose")}>Back</Button>
          </div>
        </div>
      )}

      {step === "headline" && (
        <div className="space-y-4">
          <p className="text-lg">Your headline</p>
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={randomHeadline} />
          <div className="flex flex-row-reverse items-center justify-between">
            <Button onClick={() => setStep("skills")}>Next</Button>
            <Button variant="ghost" onClick={() => setStep("handle")}>Back</Button>
          </div>
        </div>
      )}

      {step === "skills" && (
        <div className="space-y-4">
          <p className="text-lg">Your skills / stack</p>
          <div className="flex flex-wrap gap-2">
            {[...options.skills, ...options.agentic].map((opt) => (
              <button
                key={opt}
                className={`px-3 py-1 rounded border text-sm ${skills.includes(opt.toLowerCase()) ? "bg-accent" : ""}`}
                onClick={() => addToken(skills, setSkills, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <Input placeholder="Type and press Enter" onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addToken(skills, setSkills, (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }} />
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="px-2 py-1 rounded bg-accent text-sm">
                {s}
                <button className="ml-2" onClick={() => removeToken(skills, setSkills, s)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex flex-row-reverse items-center justify-between">
            <Button onClick={() => setStep("interests")}>Next</Button>
            <Button variant="ghost" onClick={() => setStep("headline")}>Back</Button>
          </div>
        </div>
      )}

      {step === "interests" && (
        <div className="space-y-4">
          <p className="text-lg">Your interests</p>
          <div className="flex flex-wrap gap-2">
            {options.agentic.map((opt) => (
              <button
                key={opt}
                className={`px-3 py-1 rounded border text-sm ${interests.includes(opt.toLowerCase()) ? "bg-accent" : ""}`}
                onClick={() => addToken(interests, setInterests, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <Input placeholder="Type and press Enter" onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addToken(interests, setInterests, (e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }} />
          <div className="flex flex-wrap gap-2">
            {interests.map((s) => (
              <span key={s} className="px-2 py-1 rounded bg-accent text-sm">
                {s}
                <button className="ml-2" onClick={() => removeToken(interests, setInterests, s)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex flex-row-reverse items-center justify-between">
            <Button onClick={() => setStep("availability")}>Next</Button>
            <Button variant="ghost" onClick={() => setStep("skills")}>Back</Button>
          </div>
        </div>
      )}

      {step === "availability" && (
        <div className="space-y-4">
          <p className="text-lg">Availability</p>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={avail.hire} onChange={(e) => setAvail({ ...avail, hire: e.target.checked })} /> Open to hire
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={avail.collab} onChange={(e) => setAvail({ ...avail, collab: e.target.checked })} /> Open to collab
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={avail.hiring} onChange={(e) => setAvail({ ...avail, hiring: e.target.checked })} /> I am hiring
            </label>
          </div>
          <div className="flex flex-row-reverse items-center justify-between">
            <Button onClick={submitAll} disabled={pending}>{pending ? "Saving..." : "Finish"}</Button>
            <Button variant="ghost" onClick={() => setStep("interests")}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}


