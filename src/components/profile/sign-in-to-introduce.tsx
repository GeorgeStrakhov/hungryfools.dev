"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import posthog from "posthog-js";

interface SignInToIntroduceProps {
  profileHandle: string;
}

export function SignInToIntroduce({ profileHandle }: SignInToIntroduceProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        posthog.capture("sign-in-for-introduction", {
          profileHandle,
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
