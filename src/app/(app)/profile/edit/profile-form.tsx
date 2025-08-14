"use client";

import * as React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createOrUpdateProfileAction } from "./profile.actions";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-utils";
import posthog from "posthog-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const schema = z.object({
  handle: z
    .string()
    .min(PROFILE_FIELD_LIMITS.handle.min)
    .max(PROFILE_FIELD_LIMITS.handle.max)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphen only"),
  displayName: z
    .string()
    .min(PROFILE_FIELD_LIMITS.displayName.min)
    .max(PROFILE_FIELD_LIMITS.displayName.max),
  headline: z
    .string()
    .min(PROFILE_FIELD_LIMITS.headline.min)
    .max(PROFILE_FIELD_LIMITS.headline.max),
  bio: z.string().max(PROFILE_FIELD_LIMITS.bio.max).optional().default(""),
  skills: z.string().max(256).optional(), // comma-separated for v1
  interests: z.string().max(256).optional(), // comma-separated for v1
  location: z.string().max(PROFILE_FIELD_LIMITS.location.max).optional(),
  github: z.string().url().optional().or(z.literal("")),
  x: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  availHire: z.boolean().optional(),
  availCollab: z.boolean().optional(),
  availHiring: z.boolean().optional(),
});

export function ProfileForm({
  defaults,
}: {
  defaults?: Partial<z.infer<typeof schema>>;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const raw = Object.fromEntries(data.entries());

    // Normalize booleans
    const values = {
      ...raw,
      availHire: raw.availHire === "on",
      availCollab: raw.availCollab === "on",
      availHiring: raw.availHiring === "on",
    } as Record<string, unknown>;

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      alert(parsed.error.issues.map((i) => i.message).join("\n"));
      return;
    }
    setPending(true);
    try {
      await createOrUpdateProfileAction(parsed.data);
      posthog.capture("profile_update");
      toast.success("Profile saved");
      router.push("/directory");
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <label>Handle</label>
        <Input
          name="handle"
          placeholder="your-handle"
          required
          defaultValue={defaults?.handle}
        />
      </div>
      <div className="grid gap-2">
        <label>Display name</label>
        <Input
          name="displayName"
          placeholder="Your Name"
          required
          defaultValue={defaults?.displayName}
        />
      </div>
      <div className="grid gap-2">
        <label>Headline</label>
        <Input
          name="headline"
          placeholder="Short headline"
          required
          defaultValue={defaults?.headline}
        />
      </div>
      <div className="grid gap-2">
        <label>Bio</label>
        <Textarea
          name="bio"
          placeholder="Tell us about yourself"
          defaultValue={defaults?.bio}
        />
      </div>
      <div className="grid gap-2">
        <label>Skills (comma separated)</label>
        <Input
          name="skills"
          placeholder="nextjs, t3, r1, agentic"
          defaultValue={defaults?.skills}
        />
      </div>
      <div className="grid gap-2">
        <label>Interests (comma separated)</label>
        <Input
          name="interests"
          placeholder="agents, evals, realtime"
          defaultValue={defaults?.interests}
        />
      </div>
      <div className="grid gap-2">
        <label>Location</label>
        <Input
          name="location"
          placeholder="Remote / City"
          defaultValue={defaults?.location}
        />
      </div>
      <div className="grid gap-2">
        <label>Links</label>
        <Input
          name="github"
          placeholder="https://github.com/you"
          defaultValue={defaults?.github}
        />
        <Input
          name="x"
          placeholder="https://x.com/you"
          defaultValue={defaults?.x}
        />
        <Input
          name="website"
          placeholder="https://you.dev"
          defaultValue={defaults?.website}
        />
        <Input
          name="email"
          placeholder="you@example.com"
          defaultValue={defaults?.email}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="availHire"
            defaultChecked={defaults?.availHire}
          />{" "}
          Open to hire
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="availCollab"
            defaultChecked={defaults?.availCollab}
          />{" "}
          Open to collab
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="availHiring"
            defaultChecked={defaults?.availHiring}
          />{" "}
          I am hiring
        </label>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
