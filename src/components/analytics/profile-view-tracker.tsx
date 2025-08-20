"use client";

import { useEffect } from "react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface ProfileViewTrackerProps {
  profileHandle: string;
  profileId: string;
  isOwner: boolean;
}

export function ProfileViewTracker({
  profileHandle,
  profileId,
  isOwner,
}: ProfileViewTrackerProps) {
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.PROFILE_VIEWED, {
      profile_handle: profileHandle,
      profile_id: profileId,
      is_owner: isOwner,
    });
  }, [profileHandle, profileId, isOwner]);

  return null; // This component doesn't render anything
}
