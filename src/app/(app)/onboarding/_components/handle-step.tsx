"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { createOrUpdateProfileAction, checkHandleAvailabilityAction } from "@/app/(app)/profile/edit/profile.actions";
import { toast } from "sonner";
import slugify from "slugify";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { validateStep } from "@/lib/hooks/useModeration";

interface HandleStepProps {
  onNext: () => void;
  onBack: () => void;
  handle?: string;
}

export function HandleStep({
  onNext,
  onBack,
  handle: initialHandle,
}: HandleStepProps) {
  const { data: session } = useSession();
  const [rawInput, setRawInput] = useState(initialHandle || "");
  const [handle, setHandle] = useState(initialHandle || "");
  const [, setSaving] = useState(false);
  const [debounceId, setDebounceId] = useState<NodeJS.Timeout | null>(null);
  const [availability, setAvailability] = useState<{
    available: boolean;
    isOwnHandle: boolean;
    checking: boolean;
    error?: string;
  }>({ available: true, isOwnHandle: false, checking: false });

  // Generate slugified preview
  const slugifiedPreview = rawInput
    ? slugify(rawInput, { lower: true, strict: true, trim: true })
    : "";

  useEffect(() => {
    if (!session?.user) return;
    if (!rawInput && !handle) {
      const candidateFromName = session.user.name
        ? slugify(session.user.name, { lower: true, strict: true, trim: true })
        : "";
      const emailLocal = session.user.email?.split("@")[0] || "";
      const candidateFromEmail = emailLocal
        ? slugify(emailLocal, { lower: true, strict: true, trim: true })
        : "";
      const fallback = session.user.id
        ? `user-${session.user.id.slice(0, 8)}`
        : "";
      const defaultHandle = candidateFromName || candidateFromEmail || fallback;
      setRawInput(defaultHandle);
      setHandle(defaultHandle);
    }
  }, [session?.user, rawInput, handle]);

  // Update handle when user finishes typing
  useEffect(() => {
    if (slugifiedPreview) {
      setHandle(slugifiedPreview);
    }
  }, [slugifiedPreview]);

  // Check handle availability with debouncing
  useEffect(() => {
    if (!slugifiedPreview || slugifiedPreview.length < 3) {
      setAvailability({ available: false, isOwnHandle: false, checking: false });
      return;
    }

    setAvailability(prev => ({ ...prev, checking: true }));

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkHandleAvailabilityAction(slugifiedPreview);
        setAvailability({
          available: result.available,
          isOwnHandle: result.isOwnHandle,
          checking: false,
          error: result.error
        });
      } catch (error) {
        setAvailability({
          available: false,
          isOwnHandle: false,
          checking: false,
          error: "Could not check availability"
        });
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [slugifiedPreview]);

  // Debounced auto-save of handle
  useEffect(() => {
    if (!handle) return;
    if (!session?.user?.id) return;
    if (debounceId) clearTimeout(debounceId);

    const id = setTimeout(async () => {
      setSaving(true);
      try {
        await createOrUpdateProfileAction({ handle });
      } catch (error) {
        console.error("Failed to save handle:", error);
      } finally {
        setSaving(false);
      }
    }, 1000);

    setDebounceId(id);
    return () => clearTimeout(id);
  }, [handle, session?.user?.id]);

  const handleNext = async () => {
    if (!slugifiedPreview.trim()) {
      toast.error("Please enter a handle");
      return;
    }

    if (slugifiedPreview.length < 3) {
      toast.error("Handle must be at least 3 characters long");
      return;
    }

    if (!availability.available) {
      toast.error("Please choose a different handle");
      return;
    }

    try {
      // Moderate the handle
      await validateStep(slugifiedPreview, "handle", 50);
      
      await createOrUpdateProfileAction({ handle: slugifiedPreview.trim() });
      onNext();
    } catch (error: any) {
      if (error?.message === "HANDLE_TAKEN") {
        toast.error("This handle is already taken. Please choose another.");
      } else if (error?.name === "ModerationError") {
        toast.error(error.message); // Show moderation error
      } else {
        toast.error("Could not save handle. Try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Pick your handle</h1>
        <p className="text-muted-foreground mt-2">
          This will be your unique identifier
        </p>
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
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Your Handle"
              className="text-lg pr-10"
            />
            {slugifiedPreview.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {availability.checking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : availability.available ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            )}
          </div>
          
          {rawInput && slugifiedPreview !== rawInput && (
            <div className="mt-2 rounded-lg bg-muted p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Handle will be:
              </p>
              <p className="font-mono text-sm font-semibold">
                {slugifiedPreview}
              </p>
            </div>
          )}
          
          {slugifiedPreview.length > 0 && (
            <div className="mt-4">
              {slugifiedPreview.length < 3 ? (
                <p className="text-sm text-amber-600">
                  Handle must be at least 3 characters long
                </p>
              ) : !availability.checking ? (
                availability.error ? (
                  <p className="text-sm text-red-600">
                    {availability.error}
                  </p>
                ) : availability.available ? (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {availability.isOwnHandle ? "This is your current handle" : "Handle is available"}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Handle is already taken
                  </p>
                )
              ) : null}
            </div>
          )}
          
          {slugifiedPreview.length >= 3 && availability.available && !availability.checking && (
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
            disabled={!slugifiedPreview.trim() || slugifiedPreview.length < 3 || !availability.available || availability.checking}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
