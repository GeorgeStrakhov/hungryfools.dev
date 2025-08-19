"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { type Step, getNextStep, getPrevStep, buildStepUrl } from "./steps";

export function useStepNavigation(currentStep: Step) {
  const router = useRouter();

  const navigateToStep = useCallback(
    (step: Step) => {
      const url = buildStepUrl(step);
      router.push(url);
    },
    [router],
  );

  const goNext = useCallback(() => {
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      navigateToStep(nextStep);
    }
  }, [currentStep, navigateToStep]);

  const goPrev = useCallback(() => {
    const prevStep = getPrevStep(currentStep);
    if (prevStep) {
      navigateToStep(prevStep);
    }
  }, [currentStep, navigateToStep]);

  const goToDirectory = useCallback(() => {
    router.replace("/directory");
  }, [router]);

  const skipStep = useCallback(() => {
    goNext();
  }, [goNext]);

  return {
    navigateToStep,
    goNext,
    goPrev,
    goToDirectory,
    skipStep,
  };
}
