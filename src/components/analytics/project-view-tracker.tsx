"use client";

import { useEffect } from "react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

interface ProjectViewTrackerProps {
  projectSlug: string;
  projectName: string;
  profileHandle: string;
  isOwner?: boolean;
}

export function ProjectViewTracker({
  projectSlug,
  projectName,
  profileHandle,
  isOwner = false,
}: ProjectViewTrackerProps) {
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.PROJECT_VIEWED, {
      project_slug: projectSlug,
      project_name: projectName,
      profile_handle: profileHandle,
      is_owner: isOwner,
    });
  }, [projectSlug, projectName, profileHandle, isOwner]);

  return null; // This component doesn't render anything
}
