import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { STEPS, isValidStep, type Step } from "../_lib/steps";
import { OnboardingStepClient } from "./step-client";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

interface OnboardingStepPageProps {
  params: Promise<{ step: string }>;
}

export default async function OnboardingStepPage({
  params,
}: OnboardingStepPageProps) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  // If onboarding already completed, do not allow re-entry
  const [userRow] = await db
    .select({ completed: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (userRow?.completed) {
    // Allow the done step to render even after completion so users see the final screen
    const resolvedParams2 = await params;
    if (resolvedParams2.step !== "done") {
      redirect("/directory");
    }
  }

  // Resolve params
  const resolvedParams = await params;
  const stepParam = resolvedParams.step;

  // Validate step
  if (!isValidStep(stepParam)) {
    notFound();
  }

  const currentStep: Step = stepParam;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingStepClient step={currentStep} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  return STEPS.map((step) => ({
    step,
  }));
}
