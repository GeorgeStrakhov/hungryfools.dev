"use client";

import * as React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
import { createOrUpdateProfileAction } from "./profile.actions";
import { PROFILE_FIELD_LIMITS, normalizeHandle } from "@/lib/profile-utils";
import { ImageUpload } from "@/components/media/image-upload";
import { getAvatarUrl } from "@/lib/utils/avatar";
import posthog from "posthog-js";
import {
  PURPOSE_OPTIONS,
  VIBE_OPTIONS,
  STACK_CORE,
  EXPERTISE_OTHER,
} from "@/lib/onboarding-options";
import { updateOnboardingFromEditAction } from "@/app/(app)/onboarding/actions";
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
  onboardingData,
  initialPurposes,
  profileImage,
  userImage,
}: {
  defaults?: Partial<z.infer<typeof schema>>;
  onboardingData?: {
    vibeTags?: string[];
    vibeSelections?: string[];
    vibeText?: string;
    stackSelections?: string[];
    stackText?: string;
    expertiseSelections?: string[];
  };
  initialPurposes?: string[];

  profileImage?: string | null;
  userImage?: string | null;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);
  const [currentProfileImage, setCurrentProfileImage] = React.useState<
    string | null
  >(profileImage || null);
  const router = useRouter();
  // Local state for onboarding-derived fields
  const [purposes, setPurposes] = React.useState<string[]>(
    initialPurposes ?? [],
  );
  const [vibes, setVibes] = React.useState<string[]>(
    onboardingData?.vibeSelections ?? [],
  );
  const [vibeText, setVibeText] = React.useState<string>(
    onboardingData?.vibeText ?? "",
  );
  const [stack, setStack] = React.useState<string[]>(
    onboardingData?.stackSelections ?? [],
  );
  const [stackText, setStackText] = React.useState<string>(
    onboardingData?.stackText ?? "",
  );
  const [expertise, setExpertise] = React.useState<string[]>(
    onboardingData?.expertiseSelections ?? [],
  );
  // Inputs for chip autocompletes
  const [vibeInput, setVibeInput] = React.useState("");
  const [stackInput, setStackInput] = React.useState("");
  const [expertiseInput, setExpertiseInput] = React.useState("");
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
      // Save canonical profile fields (server will moderate)
      await createOrUpdateProfileAction({
        ...parsed.data,
        profileImage: currentProfileImage || undefined,
      });
      // Save onboarding-derived fields in one go with normalization
      await updateOnboardingFromEditAction({
        purposes,
        vibes,
        vibeText,
        stack,
        stackText,
        expertise,
      });
      posthog.capture("profile_update");
      toast.success("Profile saved");
      try {
        const res = await fetch("/api/user/handle");
        const data = await res.json();
        const finalHandle =
          (data && data.handle) || normalizeHandle(parsed.data.handle);
        router.push(`/u/${finalHandle}`);
      } catch {
        const fallback = normalizeHandle(parsed.data.handle);
        router.push(`/u/${fallback}`);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { name?: string; message?: string };
      if (error?.message === "HANDLE_TAKEN") {
        toast.error("This handle is already taken. Please choose another.");
      } else if (error?.name === "ModerationError") {
        toast.error(error.message || "Content did not pass moderation");
      } else {
        toast.error("Duck says: couldn’t save profile. Try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid max-w-4xl gap-4">
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
        <label>Profile Picture</label>
        <div className="space-y-4">
          {/* Current avatar preview */}
          <div className="flex items-center gap-4">
            <img
              src={getAvatarUrl(currentProfileImage, userImage)}
              alt="Profile picture"
              className="h-16 w-16 rounded-full object-cover"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Picture</p>
              <p className="text-muted-foreground text-xs">
                {currentProfileImage
                  ? "Custom image"
                  : userImage
                    ? "GitHub avatar"
                    : "Default avatar"}
              </p>
            </div>
          </div>

          {/* Upload component */}
          <ImageUpload
            value={currentProfileImage}
            onChange={setCurrentProfileImage}
            uploadUrl="/api/upload"
            label="Upload custom picture"
            className="max-w-md"
          />

          {/* Reset button */}
          {currentProfileImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentProfileImage(null)}
              className="w-fit"
            >
              Reset to GitHub avatar
            </Button>
          )}
        </div>
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
      {/* Availability now controlled by Purposes section below */}

      {/* Onboarding-derived fields */}
      <div className="mt-8 space-y-8 border-t pt-8">
        <h3 className="text-xl font-semibold md:text-2xl">
          Profile Preferences
        </h3>
        {/* Purposes */}
        <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
          <label className="text-base font-semibold md:text-lg">
            What are you here for?
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PURPOSE_OPTIONS.map((o) => {
              const active = purposes.includes(o.key);
              return (
                <Button
                  key={o.key}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="h-auto justify-start p-3 text-sm md:p-4 md:text-base"
                  onClick={() =>
                    setPurposes((prev) =>
                      prev.includes(o.key)
                        ? prev.filter((k) => k !== o.key)
                        : [...prev, o.key],
                    )
                  }
                >
                  {o.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Vibes */}
        <div className="mt-6 space-y-3 md:mt-8 md:space-y-4">
          <label className="text-base font-semibold md:text-lg">
            Your vibe
          </label>
          {/* Chips */}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vibes.map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setVibes((prev) => prev.filter((x) => x !== v))
                  }
                >
                  {v} ×
                </Button>
              ))}
            </div>
          )}
          {/* Autocomplete input */}
          <Input
            value={vibeInput}
            onChange={(e) => setVibeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const term = vibeInput.trim();
                if (!term) return;
                const k = term.toLowerCase();
                if (!vibes.includes(k)) setVibes([...vibes, k]);
                setVibeInput("");
              }
            }}
            placeholder="Type to add (press Enter)"
          />
          {vibeInput.trim() && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VIBE_OPTIONS.filter((o) =>
                o.toLowerCase().includes(vibeInput.toLowerCase()),
              )
                .slice(0, 8)
                .map((opt) => {
                  const k = opt.toLowerCase();
                  const disabled = vibes.includes(k);
                  return (
                    <Button
                      key={opt}
                      type="button"
                      variant={disabled ? "secondary" : "outline"}
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setVibes([...vibes, k]);
                        setVibeInput("");
                      }}
                      className="h-auto justify-start p-3 text-sm md:p-4 md:text-base"
                    >
                      {opt}
                    </Button>
                  );
                })}
            </div>
          )}
          <Input
            id="vibeText"
            value={vibeText}
            onChange={(e) => setVibeText(e.target.value)}
            placeholder="Add more details (optional)"
          />
        </div>

        {/* Stack */}
        <div className="mt-6 space-y-3 md:mt-8 md:space-y-4">
          <label className="pb-4 text-base font-semibold md:text-lg">
            Your stack
          </label>
          {stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stack.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setStack((prev) => prev.filter((x) => x !== s))
                  }
                >
                  {s} ×
                </Button>
              ))}
            </div>
          )}
          <Input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const term = stackInput.trim();
                if (!term) return;
                const k = term.toLowerCase();
                if (!stack.includes(k)) setStack([...stack, k]);
                setStackInput("");
              }
            }}
            placeholder="Type to add technology (press Enter)"
          />
          {stackInput.trim() && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STACK_CORE.filter((o) =>
                o.toLowerCase().includes(stackInput.toLowerCase()),
              )
                .slice(0, 8)
                .map((opt) => {
                  const k = opt.toLowerCase();
                  const disabled = stack.includes(k);
                  return (
                    <Button
                      key={opt}
                      type="button"
                      variant={disabled ? "secondary" : "outline"}
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setStack([...stack, k]);
                        setStackInput("");
                      }}
                      className="h-auto justify-start p-3 text-sm md:p-4 md:text-base"
                    >
                      {opt}
                    </Button>
                  );
                })}
            </div>
          )}
          <Input
            id="stackText"
            value={stackText}
            onChange={(e) => setStackText(e.target.value)}
            placeholder="What’s your power tool/language?"
          />
        </div>

        {/* Expertise */}
        <div className="mt-6 space-y-3 md:mt-8 md:space-y-4">
          <label className="text-base font-semibold md:text-lg">
            Other expertise
          </label>
          {expertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expertise.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setExpertise((prev) => prev.filter((x) => x !== s))
                  }
                >
                  {s} ×
                </Button>
              ))}
            </div>
          )}
          <Input
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const term = expertiseInput.trim();
                if (!term) return;
                const k = term.toLowerCase();
                if (!expertise.includes(k)) setExpertise([...expertise, k]);
                setExpertiseInput("");
              }
            }}
            placeholder="Type to add expertise (press Enter)"
          />
          {expertiseInput.trim() && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXPERTISE_OTHER.filter((o) =>
                o.toLowerCase().includes(expertiseInput.toLowerCase()),
              )
                .slice(0, 8)
                .map((opt) => {
                  const k = opt.toLowerCase();
                  const disabled = expertise.includes(k);
                  return (
                    <Button
                      key={opt}
                      type="button"
                      variant={disabled ? "secondary" : "outline"}
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setExpertise([...expertise, k]);
                        setExpertiseInput("");
                      }}
                      className="h-auto justify-start p-3 text-sm md:p-4 md:text-base"
                    >
                      {opt}
                    </Button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
