"use client";

import {
  useOnboardingContext,
  type OnboardingData,
} from "../_context/onboarding-context";
import { useCallback } from "react";

export function useOnboarding() {
  const context = useOnboardingContext();

  // Convenience methods for updating specific fields
  const updatePurposes = useCallback(
    (purposes: string[]) => {
      context.updateData("purposes", purposes);
    },
    [context],
  );

  const updateHandle = useCallback(
    (handle: string) => {
      context.updateData("handle", handle);
    },
    [context],
  );

  const updateLocation = useCallback(
    (location: string) => {
      context.updateData("location", location);
    },
    [context],
  );

  const updateVibes = useCallback(
    (vibes: string[]) => {
      context.updateData("vibes", vibes);
    },
    [context],
  );

  const updateVibeText = useCallback(
    (vibeText: string) => {
      context.updateData("vibeText", vibeText);
    },
    [context],
  );

  const updateStack = useCallback(
    (stack: string[]) => {
      context.updateData("stack", stack);
    },
    [context],
  );

  const updateStackText = useCallback(
    (stackText: string) => {
      context.updateData("stackText", stackText);
    },
    [context],
  );

  const updateExpertise = useCallback(
    (expertise: string[]) => {
      context.updateData("expertise", expertise);
    },
    [context],
  );

  const updateShowcase = useCallback(
    (showcase: OnboardingData["showcase"]) => {
      context.updateData("showcase", showcase);
    },
    [context],
  );

  // Derived state for easier access
  const { data, loading, saving, error, initialized } = context.state;

  return {
    // State
    data,
    loading,
    saving,
    error,
    initialized,

    // Individual field accessors
    purposes: data.purposes,
    handle: data.handle,
    location: data.location,
    vibes: data.vibes,
    vibeText: data.vibeText,
    stack: data.stack,
    stackText: data.stackText,
    expertise: data.expertise,
    showcase: data.showcase,

    // Update functions
    updatePurposes,
    updateHandle,
    updateLocation,
    updateVibes,
    updateVibeText,
    updateStack,
    updateStackText,
    updateExpertise,
    updateShowcase,
    bulkUpdate: context.bulkUpdateData,
    // Save helpers
    saveOverrides: context.saveOverrides,
    saveField: context.saveField,

    // Control functions
    save: context.save,
    refresh: context.refresh,
    setLoading: context.setLoading,
    setSaving: context.setSaving,
    setError: context.setError,
  };
}
