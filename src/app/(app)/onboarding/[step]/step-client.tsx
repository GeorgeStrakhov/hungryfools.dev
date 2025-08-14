"use client";

import { useSearchParams } from "next/navigation";
import { type Step, getStepProgress } from "../_lib/steps";
import { useStepNavigation } from "../_lib/navigation";
import { PurposeStep } from "../_components/purpose-step";
import { HandleStep } from "../_components/handle-step";
import { LocationStep } from "../_components/location-step";
import { VibeStep } from "../_components/vibe-step";
import { StackStep } from "../_components/stack-step";
import { ExpertiseStep } from "../_components/expertise-step";
import { ShowcaseStep } from "../_components/showcase-step";
import { DoneStep } from "../_components/done-step";

interface OnboardingStepClientProps {
  step: Step;
  handle?: string;
}

export function OnboardingStepClient({
  step,
  handle: initialHandle,
}: OnboardingStepClientProps) {
  const params = useSearchParams();
  const handle = initialHandle || params.get("handle") || "";

  const { goNext, goPrev, skipStep, goToDirectory } = useStepNavigation(
    step,
    handle,
  );

  // Progress indicator
  const progress = getStepProgress(step);

  const renderStep = () => {
    switch (step) {
      case "purpose":
        return <PurposeStep onNext={goNext} />;

      case "handle":
        return <HandleStep onNext={goNext} onBack={goPrev} handle={handle} />;

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
        return (
          <ShowcaseStep onNext={goNext} onBack={goPrev} onSkip={skipStep} />
        );

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
