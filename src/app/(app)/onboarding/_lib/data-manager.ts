"use server";

import { createOrUpdateProfileAction } from "@/components/profile/profile.actions";
import {
  saveVibeAction,
  saveStackAction,
  saveExpertiseAction,
} from "../actions";
import { type OnboardingData } from "../_context/onboarding-context";

export interface SaveOptions {
  skipAIProcessing?: boolean;
  fields?: (keyof OnboardingData)[];
}

export async function saveOnboardingData(
  data: OnboardingData,
  options: SaveOptions = {},
) {
  const { skipAIProcessing = false, fields } = options;

  console.log("📥 DataManager: saveOnboardingData called", { data, options });

  try {
    // If specific fields are requested, only save those
    const fieldsToSave =
      fields || (Object.keys(data) as (keyof OnboardingData)[]);

    console.log("📝 DataManager: Fields to save", fieldsToSave);

    // Prepare profile updates
    const profileUpdates: Record<string, unknown> = {};

    // Purpose step - convert to availability flags
    if (fieldsToSave.includes("purposes")) {
      profileUpdates.availCollab = data.purposes.includes("find");
      profileUpdates.availHire = data.purposes.includes("get_hired");
      profileUpdates.availHiring = data.purposes.includes("hiring");
      profileUpdates.showcase = data.purposes.includes("list");
    }

    // Handle step
    if (fieldsToSave.includes("handle") && data.handle) {
      profileUpdates.handle = data.handle.trim();
    }

    // Location step
    if (fieldsToSave.includes("location") && data.location) {
      profileUpdates.location = data.location.trim();
    }

    // Vibe step - save raw data
    if (fieldsToSave.includes("vibes") || fieldsToSave.includes("vibeText")) {
      if (data.vibes) profileUpdates.vibeSelections = data.vibes;
      if (data.vibeText.trim()) {
        profileUpdates.vibeText = data.vibeText.trim();
        profileUpdates.headline = data.vibeText.trim(); // Use user's exact words as headline
      }
    }

    // Stack step - save raw data
    if (fieldsToSave.includes("stack") || fieldsToSave.includes("stackText")) {
      if (data.stack) profileUpdates.stackSelections = data.stack;
      if (data.stackText.trim())
        profileUpdates.stackText = data.stackText.trim();
    }

    // Expertise step - save raw data
    if (fieldsToSave.includes("expertise")) {
      if (data.expertise) profileUpdates.expertiseSelections = data.expertise;
    }

    // Save to database
    console.log("💽 DataManager: Profile updates to save", profileUpdates);
    if (Object.keys(profileUpdates).length > 0) {
      await createOrUpdateProfileAction(profileUpdates);
      console.log("✅ DataManager: Profile saved to database");
    } else {
      console.log("⚠️ DataManager: No profile updates to save");
    }

    // Process with AI if not skipping
    if (!skipAIProcessing) {
      const promises: Promise<unknown>[] = [];

      // Process vibe data for tags
      if (
        (fieldsToSave.includes("vibes") || fieldsToSave.includes("vibeText")) &&
        (data.vibes.length > 0 || data.vibeText.trim())
      ) {
        promises.push(
          saveVibeAction({
            vibes: data.vibes,
            oneLine: data.vibeText,
          }),
        );
      }

      // Process stack data for skills
      if (
        (fieldsToSave.includes("stack") ||
          fieldsToSave.includes("stackText")) &&
        (data.stack.length > 0 || data.stackText.trim())
      ) {
        promises.push(
          saveStackAction({
            stack: data.stack,
            power: data.stackText,
          }),
        );
      }

      // Process expertise data for interests
      if (fieldsToSave.includes("expertise") && data.expertise.length > 0) {
        promises.push(
          saveExpertiseAction({
            expertise: data.expertise,
          }),
        );
      }

      // Wait for all AI processing to complete
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save onboarding data:", error);
    throw error;
  }
}

export async function saveOnboardingField<K extends keyof OnboardingData>(
  field: K,
  value: OnboardingData[K],
  allData: OnboardingData,
  options: SaveOptions = {},
) {
  // Create a temporary data object with the updated field
  const updatedData = { ...allData, [field]: value };

  // Save only the specific field
  return saveOnboardingData(updatedData, { ...options, fields: [field] });
}
