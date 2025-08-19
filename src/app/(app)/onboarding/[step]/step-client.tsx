"use client";

import { type Step, getStepProgress, getNextStep } from "../_lib/steps";
import { useStepNavigation } from "../_lib/navigation";
import { PurposeStep } from "../_components/purpose-step";
import { HandleStep } from "../_components/handle-step";
import { LocationStep } from "../_components/location-step";
import { VibeStep } from "../_components/vibe-step";
import { StackStep } from "../_components/stack-step";
import { ExpertiseStep } from "../_components/expertise-step";
import { ShowcaseStep } from "../_components/showcase-step";
import { DoneStep } from "../_components/done-step";
import { useOnboardingWizard } from "../_context/wizard-context";
import { toast } from "sonner";
import { useEffect } from "react";

interface OnboardingStepClientProps {
  step: Step;
}

export function OnboardingStepClient({ step }: OnboardingStepClientProps) {
  const {
    goNext: navNext,
    goPrev,
    skipStep,
    goToDirectory,
  } = useStepNavigation(step);
  const { finalize } = useOnboardingWizard();

  // Progress indicator
  const progress = getStepProgress(step);

  // Wrapper: before navigating from the last data step to done, finalize data
  const goNext = async () => {
    const next = getNextStep(step);
    if (next === "done") {
      try {
        await finalize();
      } catch (e) {
        const err = e as { message?: string };
        toast.error(
          err?.message || "Failed to save. Please fix and try again.",
        );
        return; // stay on current step
      }
    }
    navNext();
  };

  // Wrapper for skip (e.g., showcase skip). If skipping leads to done, finalize first
  const goSkip = async () => {
    const next = getNextStep(step);
    if (next === "done") {
      try {
        await finalize();
      } catch (e) {
        const err = e as { message?: string };
        toast.error(
          err?.message || "Failed to save. Please fix and try again.",
        );
        return;
      }
    }
    skipStep();
  };

  // Safety net: if user lands on done directly, attempt finalize once
  useEffect(() => {
    if (step === "done") {
      finalize().catch(() => {});
    }
  }, [step, finalize]);

  const renderStep = () => {
    switch (step) {
      case "purpose":
        return <PurposeStep onNext={goNext} />;

      case "handle":
        return <HandleStep onNext={goNext} onBack={goPrev} />;

      case "location":
        return (
          <LocationStep onNext={goNext} onBack={goPrev} onSkip={skipStep} />
        );

      case "vibe":
        return <VibeStep onNext={goNext} onBack={goPrev} />;

      case "stack":
        return <StackStep onNext={goNext} onBack={goPrev} />;

      case "expertise":
        return (
          <ExpertiseStep onNext={goNext} onBack={goPrev} onSkip={skipStep} />
        );

      case "showcase":
        return <ShowcaseStep onNext={goNext} onBack={goPrev} onSkip={goSkip} />;

      case "done":
        return <DoneStep onFinish={goToDirectory} />;

      default:
        return <div>Invalid step: {step}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {step !== "done" && (
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--hf-yellow)",
            }}
          />
        </div>
      )}

      {/* Step content */}
      <div className="onboarding-step">{renderStep()}</div>
    </div>
  );
}
