"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  BriefcaseBusiness,
  UserPlus2,
  Loader2,
} from "lucide-react";
import { Question } from "./question";
import { STEP_CONFIG } from "../_lib/steps";
import { useOnboardingWizard } from "../_context/wizard-context";
import { useState } from "react";
import posthog from "posthog-js";

const OPTIONS = [
  {
    key: "list",
    label: "List myself as an expert vibecoder / AI-first developer",
    icon: <Sparkles className="size-5" />,
  },
  {
    key: "find",
    label: "Find vibecoders / AI-first developers to work with",
    icon: <Users className="size-5" />,
  },
  {
    key: "get_hired",
    label: "Get hired",
    icon: <BriefcaseBusiness className="size-5" />,
  },
  {
    key: "hiring",
    label: "I'm hiring AI-first developers",
    icon: <UserPlus2 className="size-5" />,
  },
];

interface PurposeStepProps {
  onNext: () => void;
}

export function PurposeStep({ onNext }: PurposeStepProps) {
  const router = useRouter();
  const { data, setField } = useOnboardingWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      data.purposes.forEach((v) => posthog.capture("purpose_select", { choice: v }));
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image src="/images/PacDuck.png" alt="PacDuck" width={120} height={120} />
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.purpose.title}</h1>
        {STEP_CONFIG.purpose.subtitle && (
          <p className="text-muted-foreground">{STEP_CONFIG.purpose.subtitle}</p>
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
