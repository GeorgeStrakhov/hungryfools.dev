"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { completeOnboardingAction } from "../actions";

export interface OnboardingWizardData {
  purposes: string[];
  handle: string;
  location: string;
  vibes: string[];
  vibeText: string;
  stack: string[];
  stackText: string;
  expertise: string[];
}

const defaultData: OnboardingWizardData = {
  purposes: [],
  handle: "",
  location: "",
  vibes: [],
  vibeText: "",
  stack: [],
  stackText: "",
  expertise: [],
};

interface WizardContextValue {
  data: OnboardingWizardData;
  setField: <K extends keyof OnboardingWizardData>(
    field: K,
    value: OnboardingWizardData[K],
  ) => void;
  bulkSet: (partial: Partial<OnboardingWizardData>) => void;
  reset: () => void;
  finalizing: boolean;
  finalize: () => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

function storageKey(userId: string | undefined) {
  return userId ? `onboarding:${userId}` : "onboarding:anon";
}

export function OnboardingWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [data, setData] = useState<OnboardingWizardData>(defaultData);
  const [finalizing, setFinalizing] = useState(false);

  // Load from localStorage once per user
  useEffect(() => {
    const key = storageKey(session?.user?.id);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as OnboardingWizardData;
        setData({ ...defaultData, ...parsed });
      }
    } catch {}
  }, [session?.user?.id]);

  // Persist to localStorage on change
  useEffect(() => {
    const key = storageKey(session?.user?.id);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }, [data, session?.user?.id]);

  const setField = useCallback(
    <K extends keyof OnboardingWizardData>(
      field: K,
      value: OnboardingWizardData[K],
    ) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const bulkSet = useCallback((partial: Partial<OnboardingWizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setData(defaultData), []);

  const finalize = useCallback(async () => {
    if (!session?.user?.id) return;
    setFinalizing(true);
    try {
      await completeOnboardingAction({
        purposes: data.purposes,
        handle: data.handle,
        location: data.location,
        vibes: data.vibes,
        vibeText: data.vibeText,
        stack: data.stack,
        stackText: data.stackText,
        expertise: data.expertise,
      });
      // Clear local storage after success
      try {
        localStorage.removeItem(storageKey(session.user.id));
      } catch {}
    } finally {
      setFinalizing(false);
    }
  }, [data, session?.user?.id]);

  const value = useMemo<WizardContextValue>(
    () => ({ data, setField, bulkSet, reset, finalizing, finalize }),
    [data, setField, bulkSet, reset, finalizing, finalize],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useOnboardingWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx)
    throw new Error(
      "useOnboardingWizard must be used within OnboardingWizardProvider",
    );
  return ctx;
}
