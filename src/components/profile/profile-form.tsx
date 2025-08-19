"use client";

import * as React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createOrUpdateProfileAction } from "./profile.actions";
import { PROFILE_FIELD_LIMITS } from "@/lib/profile-utils";
import { ImageUpload } from "@/components/media/image-upload";
import { getAvatarUrl } from "@/lib/utils/avatar";
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
  onboardingData,
  redirectTo,
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
  redirectTo?: string;
  profileImage?: string | null;
  userImage?: string | null;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);
  const [currentProfileImage, setCurrentProfileImage] = React.useState<
    string | null
  >(profileImage || null);
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
      await createOrUpdateProfileAction({
        ...parsed.data,
        profileImage: currentProfileImage || undefined,
      });
      posthog.capture("profile_update");
      toast.success("Profile saved");
      router.push(redirectTo || "/directory");
    } catch (err: unknown) {
      console.error(err);
      const error = err as { name?: string; message?: string };
      if (error?.name === "ModerationError") {
        toast.error(error.message || "Content did not pass moderation");
      } else {
        toast.error("Failed to save profile");
      }
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
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="availHire"
            name="availHire"
            defaultChecked={defaults?.availHire}
          />
          <label htmlFor="availHire">Open to hire</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="availCollab"
            name="availCollab"
            defaultChecked={defaults?.availCollab}
          />
          <label htmlFor="availCollab">Open to collab</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="availHiring"
            name="availHiring"
            defaultChecked={defaults?.availHiring}
          />
          <label htmlFor="availHiring">I am hiring</label>
        </div>
      </div>

      {/* Onboarding Data section removed to simplify edit UI */}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
