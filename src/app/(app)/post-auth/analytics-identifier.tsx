"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface AnalyticsIdentifierProps {
  redirectTo: string;
}

export function AnalyticsIdentifier({ redirectTo }: AnalyticsIdentifierProps) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      // Identify the user in analytics
      analytics.identify(session.user.id, {
        userId: session.user.id,
        email: session.user.email || undefined,
        displayName: session.user.name || undefined,
      });

      // Track sign in event
      analytics.track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
        provider: "github",
      });

      // Small delay to ensure analytics tracking completes
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
  }, [session?.user, router, redirectTo]);

  return null; // This component doesn't render anything
}
