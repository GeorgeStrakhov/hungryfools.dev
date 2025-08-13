"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createOrUpdateProfileAction } from "@/app/(app)/profile/edit/profile.actions";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import { validateStep } from "@/lib/hooks/useModeration";

interface LocationStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function LocationStep({ onNext, onBack, onSkip }: LocationStepProps) {
  const [location, setLocation] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      setIsDetecting(true);
      try {
        // Use ipapi.co for IP-based location detection
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data.city && data.region) {
          const detected = `${data.city}, ${data.region}`;
          setDetectedLocation(detected);
          setLocation(detected);
        }
      } catch (error) {
        console.error("Failed to detect location:", error);
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocation();
  }, []);

  const handleNext = async () => {
    if (!location.trim()) {
      toast.error("Please enter your location or skip this step");
      return;
    }

    try {
      // Moderate location input
      await validateStep(location.trim(), "location", 100);

      await createOrUpdateProfileAction({ location: location.trim() });
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
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Where are you based?</h1>
        <p className="text-muted-foreground mt-2">
          Help others find local collaborators
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium">
            Location
          </label>
          <div className="relative">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
          {detectedLocation && (
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
            <Button onClick={handleNext}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
