"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Users, BriefcaseBusiness, UserPlus2 } from "lucide-react";
import { Question } from "./question";
import { createOrUpdateProfileAction } from "@/app/(app)/profile/edit/profile.actions";
import posthog from "posthog-js";

const OPTIONS = [
  {
    key: "list",
    label: "List myself as an expert vibecoder",
    icon: <Sparkles className="size-5" />,
  },
  {
    key: "find",
    label: "Find vibecoders to work with",
    icon: <Users className="size-5" />,
  },
  {
    key: "get_hired",
    label: "Get hired",
    icon: <BriefcaseBusiness className="size-5" />,
  },
  {
    key: "hiring",
    label: "I am hiring",
    icon: <UserPlus2 className="size-5" />,
  },
];

interface PurposeStepProps {
  onNext: () => void;
}

export function PurposeStep({ onNext }: PurposeStepProps) {
  const router = useRouter();
  const [value, setValue] = useState<string[]>([]);

  const handleNext = async () => {
    value.forEach((v) => posthog.capture("purpose_select", { choice: v }));

    if (value.includes("find") && value.length === 1) {
      await createOrUpdateProfileAction({
        displayName: "",
        headline: "I ship MVPs before your coffee gets cold",
        availCollab: true,
      });
      // Skip directly to directory
      router.replace("/directory");
      return;
    } else {
      await createOrUpdateProfileAction({
        displayName: "",
        headline: "",
        availCollab: value.includes("find"),
        availHire: value.includes("get_hired"),
        availHiring: value.includes("hiring"),
      });
      onNext();
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
        <h1 className="text-2xl font-semibold">PacDuck says welcome!</h1>
        <p className="text-muted-foreground">What are you here for, dear?</p>
      </div>
      <Question
        title="Select one or more"
        options={OPTIONS}
        multi
        value={value}
        onChange={setValue}
        onNext={handleNext}
      />
    </div>
  );
}
