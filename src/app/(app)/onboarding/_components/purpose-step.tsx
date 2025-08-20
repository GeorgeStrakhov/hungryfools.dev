"use client";

import Image from "next/image";
import { Sparkles, Users, BriefcaseBusiness, UserPlus2 } from "lucide-react";
import { Question } from "./question";
import { STEP_CONFIG } from "../_lib/steps";
import { useOnboardingWizard } from "../_context/wizard-context";
import { PURPOSE_OPTIONS } from "@/lib/onboarding-options";
import { useState } from "react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

const OPTIONS = PURPOSE_OPTIONS.map((o) => ({
  ...o,
  icon:
    o.key === "list" ? (
      <Sparkles className="size-5" />
    ) : o.key === "find" ? (
      <Users className="size-5" />
    ) : o.key === "get_hired" ? (
      <BriefcaseBusiness className="size-5" />
    ) : (
      <UserPlus2 className="size-5" />
    ),
}));

interface PurposeStepProps {
  onNext: () => void;
}

export function PurposeStep({ onNext }: PurposeStepProps) {
  // const router = useRouter();
  const { data, setField } = useOnboardingWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      data.purposes.forEach((v) =>
        analytics.track(ANALYTICS_EVENTS.PURPOSE_SELECT, { choice: v }),
      );
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image
          src="/images/PacDuck.png"
          alt="PacDuck"
          width={120}
          height={120}
        />
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.purpose.title}</h1>
        {STEP_CONFIG.purpose.subtitle && (
          <p className="text-muted-foreground">
            {STEP_CONFIG.purpose.subtitle}
          </p>
        )}
      </div>
      <Question
        title="Select one or more"
        options={OPTIONS}
        multi
        value={data.purposes}
        onChange={(vals) => setField("purposes", vals)}
        onNext={handleNext}
        isSaving={isSubmitting}
      />
    </div>
  );
}
