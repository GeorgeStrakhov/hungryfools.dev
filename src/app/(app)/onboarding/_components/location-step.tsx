"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import { validateStep } from "@/lib/hooks/useModeration";
import { useOnboardingWizard } from "../_context/wizard-context";
import { STEP_CONFIG } from "../_lib/steps";

interface LocationStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function LocationStep({ onNext, onBack, onSkip }: LocationStepProps) {
  const { data, setField } = useOnboardingWizard();
  const [localLocation, setLocalLocation] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Initialize from wizard state (only once)
  useEffect(() => {
    if (hasInitialized) return;

    if (data.location) {
      setLocalLocation(data.location);
    } else {
      const detectLocation = async () => {
        setIsDetecting(true);
        try {
          const response = await fetch("https://ipapi.co/json/");
          const d = await response.json();
          if (d.city && d.region) {
            const detected = `${d.city}, ${d.region}`;
            setDetectedLocation(detected);
            // Privacy: do NOT auto-save detected location to the store
            setLocalLocation(detected);
          }
        } catch (error) {
          console.error("Failed to detect location:", error);
        } finally {
          setIsDetecting(false);
        }
      };
      detectLocation();
    }

    setHasInitialized(true);
  }, [hasInitialized, data.location, setField]);

  const handleNext = async () => {
    if (!localLocation.trim()) {
      toast.error("Please enter your location or skip this step");
      return;
    }

    try {
      await validateStep(localLocation.trim(), "location", 100);
      setField("location", localLocation.trim());
      onNext();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === "ModerationError") {
        toast.error(err.message || "Content did not pass moderation");
      } else {
        toast.error("Could not save location. Try again.");
      }
    }
  };

  const handleSkip = async () => {
    // Clear any stored location to respect privacy if user skips
    setField("location", "");
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.location.title}</h1>
        {STEP_CONFIG.location.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.location.subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium">
            Location
          </label>
          <div className="relative">
            <Input
              id="location"
              value={localLocation}
              onChange={(e) => {
                setLocalLocation(e.target.value);
                setField("location", e.target.value);
                setUserHasEdited(true);
              }}
              placeholder={
                isDetecting ? "Detecting location..." : "San Francisco, CA"
              }
              className="pr-10 text-lg"
              disabled={isDetecting}
            />
            {isDetecting && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          {detectedLocation && !userHasEdited && (
            <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <MapPin className="h-3 w-3" />
              Auto-detected from your IP address
            </p>
          )}
        </div>

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              {isDetecting ? (
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
    </div>
  );
}
