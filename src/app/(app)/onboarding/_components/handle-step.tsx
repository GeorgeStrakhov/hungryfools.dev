"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { checkHandleAvailabilityAction } from "@/components/profile/profile.actions";
import { toast } from "sonner";
import {
  generateDefaultHandle,
  normalizeHandle,
  PROFILE_FIELD_LIMITS,
} from "@/lib/profile-utils";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";

interface HandleStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function HandleStep({ onNext, onBack }: HandleStepProps) {
  const { data: session } = useSession();
  const { data: wizard, setField } = useOnboardingWizard();
  const [rawInput, setRawInput] = useState("");
  const [availability, setAvailability] = useState<{
    available: boolean;
    isOwnHandle: boolean;
    checking: boolean;
    error?: string;
  }>({ available: true, isOwnHandle: false, checking: false });
  const [submitting, setSubmitting] = useState(false);

  // Generate slugified preview
  const slugifiedPreview = rawInput ? normalizeHandle(rawInput) : "";

  // Initialize from wizard state (only once)
  useEffect(() => {
    if (rawInput) return;
    if (wizard.handle) {
      setRawInput(wizard.handle);
    } else if (session?.user) {
      const githubUsername = (session.user as any)?.githubUsername as string | undefined;
      const preferred = githubUsername ? normalizeHandle(githubUsername) : generateDefaultHandle(session.user);
      setRawInput(preferred);
      setField("handle", preferred);
    }
  }, [wizard.handle, session?.user, rawInput, setField]);

  // Check handle availability with debouncing
  useEffect(() => {
    if (
      !slugifiedPreview ||
      slugifiedPreview.length < PROFILE_FIELD_LIMITS.handle.min
    ) {
      setAvailability({
        available: false,
        isOwnHandle: false,
        checking: false,
      });
      return;
    }

    setAvailability((prev) => ({ ...prev, checking: true }));

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkHandleAvailabilityAction(slugifiedPreview);
        setAvailability({
          available: Boolean(result.available),
          isOwnHandle: Boolean(result.isOwnHandle),
          checking: false,
          error: (result as any).error,
        });
      } catch {
        setAvailability({
          available: false,
          isOwnHandle: false,
          checking: false,
          error: "Could not check availability",
        });
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [slugifiedPreview]);

  const handleNext = async () => {
    if (!slugifiedPreview.trim()) {
      toast.error("Please enter a handle");
      return;
    }

    if (slugifiedPreview.length < PROFILE_FIELD_LIMITS.handle.min) {
      toast.error(
        `Handle must be at least ${PROFILE_FIELD_LIMITS.handle.min} characters long`,
      );
      return;
    }

    if (!availability.available) {
      toast.error("Please choose a different handle");
      return;
    }

    try {
      setSubmitting(true);
      // Moderate the handle
      await validateStep(slugifiedPreview, "handle", 50);

      // Store locally; persist at finish
      setField("handle", slugifiedPreview.trim());
      onNext();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.message === "HANDLE_TAKEN") {
        toast.error("This handle is already taken. Please choose another.");
      } else if (err?.name === "ModerationError") {
        toast.error(err.message || "Content did not pass moderation");
      } else {
        toast.error("Could not save handle. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.handle.title}</h1>
        {STEP_CONFIG.handle.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.handle.subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="handle" className="mb-2 block text-sm font-medium">
            Your handle
          </label>
          <div className="relative">
            <Input
              id="handle"
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                const slugified = normalizeHandle(e.target.value);
                setField("handle", slugified || "");
              }}
              placeholder="your-handle"
              className="pr-10 text-lg"
            />
            {slugifiedPreview.length >= PROFILE_FIELD_LIMITS.handle.min && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {availability.checking ? (
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                ) : availability.available ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            )}
          </div>

          {rawInput && slugifiedPreview !== rawInput && (
            <div className="bg-muted mt-2 rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                Handle will be:
              </p>
              <p className="font-mono text-sm font-semibold">{slugifiedPreview}</p>
            </div>
          )}

          {slugifiedPreview.length > 0 && (
            <div className="mt-4">
              {slugifiedPreview.length < PROFILE_FIELD_LIMITS.handle.min ? (
                <p className="text-sm text-amber-600">
                  Handle must be at least {PROFILE_FIELD_LIMITS.handle.min} characters long
                </p>
              ) : !availability.checking ? (
                availability.error ? (
                  <p className="text-sm text-red-600">{availability.error}</p>
                ) : availability.available ? (
                  <p className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    {availability.isOwnHandle
                      ? "This is your current handle"
                      : "Handle is available"}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="h-3 w-3" />
                    Handle is already taken
                  </p>
                )
              ) : null}
            </div>
          )}

          {slugifiedPreview.length >= 3 &&
            availability.available &&
            !availability.checking && (
              <p className="text-muted-foreground mt-4 text-sm">
                Your profile will be at hungryfools.dev/u/{slugifiedPreview}
              </p>
            )}
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              !slugifiedPreview.trim() ||
              slugifiedPreview.length < PROFILE_FIELD_LIMITS.handle.min ||
              (!availability.available && !availability.isOwnHandle) ||
              availability.checking ||
              submitting
            }
          >
            {submitting ? (
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
