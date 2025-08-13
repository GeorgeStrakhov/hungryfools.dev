import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { STEPS, isValidStep, type Step } from "../_lib/steps";
import { OnboardingStepClient } from "./step-client";

interface OnboardingStepPageProps {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ handle?: string }>;
}

export default async function OnboardingStepPage({
  params,
  searchParams,
}: OnboardingStepPageProps) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  // Resolve params
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const stepParam = resolvedParams.step;
  const handle = resolvedSearchParams.handle;

  // Validate step
  if (!isValidStep(stepParam)) {
    notFound();
  }

  const currentStep: Step = stepParam;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingStepClient step={currentStep} handle={handle} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  return STEPS.map((step) => ({
    step,
  }));
}
