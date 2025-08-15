"use client";

import { useState, useEffect } from "react";
import { getOwnProfileAction } from "@/components/profile/profile.actions";
import { useSession } from "next-auth/react";

interface ProfileData {
  handle?: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  location?: string | null;
  links?: {
    github?: string;
    x?: string;
    website?: string;
    email?: string;
  } | null;
  availability?: {
    hire?: boolean;
    collab?: boolean;
    hiring?: boolean;
  } | null;
  showcase?: boolean;
  // Raw onboarding data
  vibeSelections?: string[] | null;
  vibeText?: string | null;
  stackSelections?: string[] | null;
  stackText?: string | null;
  expertiseSelections?: string[] | null;
}

export function useProfileData() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await getOwnProfileAction();
        setProfileData(profile);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session?.user?.id]);

  return {
    profileData,
    loading,
    error,
    refresh: async () => {
      if (!session?.user?.id) return;
      try {
        const profile = await getOwnProfileAction();
        setProfileData(profile);
      } catch (err) {
        console.error("Failed to refresh profile:", err);
      }
    },
  };
}
