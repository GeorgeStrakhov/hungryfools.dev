"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { getOwnProfileAction } from "@/components/profile/profile.actions";

export interface OnboardingData {
  // Purpose step
  purposes: string[];

  // Handle step
  handle: string;

  // Location step
  location: string;

  // Vibe step
  vibes: string[];
  vibeText: string;

  // Stack step
  stack: string[];
  stackText: string;

  // Expertise step
  expertise: string[];

  // Showcase step (handled separately as it creates projects)
  showcase?: {
    title: string;
    link: string;
    githubUrl: string;
    oneliner: string;
    summary: string;
    media: unknown[];
  };
}

export interface OnboardingState {
  data: OnboardingData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  initialized: boolean;
}

type OnboardingAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_INITIALIZED"; initialized: boolean }
  | { type: "UPDATE_DATA"; field: keyof OnboardingData; value: unknown }
  | { type: "BULK_UPDATE_DATA"; data: Partial<OnboardingData> }
  | { type: "RESET_DATA" };

const initialData: OnboardingData = {
  purposes: [],
  handle: "",
  location: "",
  vibes: [],
  vibeText: "",
  stack: [],
  stackText: "",
  expertise: [],
};

const initialState: OnboardingState = {
  data: initialData,
  loading: true,
  saving: false,
  error: null,
  initialized: false,
};

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_SAVING":
      return { ...state, saving: action.saving };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_INITIALIZED":
      return { ...state, initialized: action.initialized };
    case "UPDATE_DATA":
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
      };
    case "BULK_UPDATE_DATA":
      return {
        ...state,
        data: { ...state.data, ...action.data },
      };
    case "RESET_DATA":
      return { ...state, data: initialData };
    default:
      return state;
  }
}

interface OnboardingContextType {
  state: OnboardingState;
  updateData: (field: keyof OnboardingData, value: unknown) => void;
  bulkUpdateData: (data: Partial<OnboardingData>) => void;
  save: () => Promise<void>;
  // Save helpers that persist the freshest values without waiting for re-render
  saveOverrides: (
    overrides: Partial<OnboardingData>,
    fields?: (keyof OnboardingData)[],
  ) => Promise<void>;
  saveField: <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K],
  ) => Promise<void>;
  refresh: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Load initial data from profile
  const loadInitialData = useCallback(async () => {
    if (!session?.user?.id) {
      dispatch({ type: "SET_LOADING", loading: false });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      const profile = await getOwnProfileAction();

      if (profile) {
        // Map profile data to onboarding data
        const onboardingData: Partial<OnboardingData> = {};

        // Purpose step - map from availability flags
        const purposes: string[] = [];
        if (profile.showcase) purposes.push("list");
        if (profile.availability?.collab) purposes.push("find");
        if (profile.availability?.hire) purposes.push("get_hired");
        if (profile.availability?.hiring) purposes.push("hiring");
        onboardingData.purposes = purposes;

        // Handle step
        if (profile.handle) onboardingData.handle = profile.handle;

        // Location step
        if (profile.location) onboardingData.location = profile.location;

        // Vibe step - use raw selections and text
        if (profile.vibeSelections)
          onboardingData.vibes = profile.vibeSelections;
        if (profile.vibeText) onboardingData.vibeText = profile.vibeText;

        // Stack step - use raw selections and text
        if (profile.stackSelections)
          onboardingData.stack = profile.stackSelections;
        if (profile.stackText) onboardingData.stackText = profile.stackText;

        // Expertise step - use raw selections
        if (profile.expertiseSelections)
          onboardingData.expertise = profile.expertiseSelections;

        dispatch({ type: "BULK_UPDATE_DATA", data: onboardingData });
        console.log(
          "🔄 OnboardingProvider: Loaded profile data",
          onboardingData,
        );
      }

      dispatch({ type: "SET_INITIALIZED", initialized: true });
    } catch (error) {
      console.error("Failed to load onboarding data:", error);
      dispatch({ type: "SET_ERROR", error: "Failed to load profile data" });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [session?.user?.id]);

  // Load data on mount and session change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const updateData = useCallback(
    (field: keyof OnboardingData, value: unknown) => {
      console.log(`🔧 OnboardingProvider: Updating ${field}`, value);
      dispatch({ type: "UPDATE_DATA", field, value });
    },
    [],
  );

  const bulkUpdateData = useCallback((data: Partial<OnboardingData>) => {
    dispatch({ type: "BULK_UPDATE_DATA", data });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", loading });
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    dispatch({ type: "SET_SAVING", saving });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  // Save function using data manager
  const save = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      dispatch({ type: "SET_SAVING", saving: true });
      dispatch({ type: "SET_ERROR", error: null });

      // Import data manager dynamically to avoid server/client issues
      const { saveOnboardingData } = await import("../_lib/data-manager");
      console.log("💾 OnboardingProvider: Saving data", state.data);
      await saveOnboardingData(state.data);
      console.log("✅ OnboardingProvider: Save completed");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      dispatch({ type: "SET_ERROR", error: "Failed to save data" });
      throw error;
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  }, [session?.user?.id, state.data]);

  // Persist specific fields using the freshest values provided by the caller
  const saveOverrides = useCallback(
    async (
      overrides: Partial<OnboardingData>,
      fields?: (keyof OnboardingData)[],
    ) => {
      if (!session?.user?.id) return;

      try {
        dispatch({ type: "SET_SAVING", saving: true });
        dispatch({ type: "SET_ERROR", error: null });

        const { saveOnboardingData } = await import("../_lib/data-manager");
        const merged = { ...state.data, ...overrides } as OnboardingData;
        const fieldsToSave =
          fields || (Object.keys(overrides) as (keyof OnboardingData)[]);
        console.log("💾 OnboardingProvider: Saving overrides", {
          overrides,
          fields: fieldsToSave,
        });
        await saveOnboardingData(merged, { fields: fieldsToSave });
        console.log("✅ OnboardingProvider: Overrides save completed");
      } catch (error) {
        console.error("Failed to save overrides:", error);
        dispatch({ type: "SET_ERROR", error: "Failed to save data" });
        throw error;
      } finally {
        dispatch({ type: "SET_SAVING", saving: false });
      }
    },
    [session?.user?.id, state.data],
  );

  const saveField = useCallback(
    async <K extends keyof OnboardingData>(
      field: K,
      value: OnboardingData[K],
    ) => {
      await saveOverrides({ [field]: value } as Partial<OnboardingData>, [
        field,
      ]);
      // Keep local state in sync immediately
      dispatch({ type: "UPDATE_DATA", field, value });
    },
    [saveOverrides],
  );

  const refresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const contextValue: OnboardingContextType = {
    state,
    updateData,
    bulkUpdateData,
    save,
    saveOverrides,
    saveField,
    refresh,
    setLoading,
    setSaving,
    setError,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider",
    );
  }
  return context;
}
