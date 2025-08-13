"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createOrUpdateProfileAction } from "@/app/profile/edit/profile.actions";
import { Sparkles, Users, BriefcaseBusiness, UserPlus2 } from "lucide-react";
import { Question } from "@/components/onboarding/Question";
import { useState } from "react";

const OPTIONS = [
  { key: "list", label: "List myself as an expert vibecoder", icon: <Sparkles className="size-5" /> },
  { key: "find", label: "Find vibecoders to work with", icon: <Users className="size-5" /> },
  { key: "get_hired", label: "Get hired", icon: <BriefcaseBusiness className="size-5" /> },
  { key: "hiring", label: "I am hiring", icon: <UserPlus2 className="size-5" /> },
];

export default function PurposeStep() {
  const router = useRouter();
  const [value, setValue] = useState<string[]>([]);

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image src="/images/PacDuck.png" alt="PacDuck" width={120} height={120} />
        <h1 className="text-2xl font-semibold">PacDuck says welcome!</h1>
        <p className="text-muted-foreground">What are you here for, dear?</p>
      </div>
      <Question
        title="Select one or more"
        options={OPTIONS}
        multi
        value={value}
        onChange={setValue}
        onNext={async () => {
          value.forEach((v) => posthog.capture("purpose_select", { choice: v }));
          if (value.includes("find") && value.length === 1) {
            await createOrUpdateProfileAction({ headline: "I ship MVPs before your coffee gets cold", availCollab: true } as any);
            router.replace("/directory");
          } else {
            await createOrUpdateProfileAction({ availability: {
              collab: value.includes("find"),
              hire: value.includes("get_hired"),
              hiring: value.includes("hiring"),
            }} as any);
            router.push("/onboarding/handle");
          }
        }}
      />
    </div>
  );
}


