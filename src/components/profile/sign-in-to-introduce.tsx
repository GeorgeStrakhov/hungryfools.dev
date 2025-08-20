"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface SignInToIntroduceProps {
  profileHandle: string;
}

export function SignInToIntroduce({ profileHandle }: SignInToIntroduceProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        analytics.track(ANALYTICS_EVENTS.SIGN_IN_FOR_INTRODUCTION, {
          profile_handle: profileHandle,
          provider: "github",
        });
        signIn("github", {
          callbackUrl: `/u/${profileHandle}`,
        });
      }}
    >
      Sign in to get introduced
    </Button>
  );
}
