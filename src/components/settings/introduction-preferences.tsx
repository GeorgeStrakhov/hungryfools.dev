"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function IntroductionPreferences() {
  const [allowIntroductions, setAllowIntroductions] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/user/introduction-preferences");
      if (response.ok) {
        const data = await response.json();
        setAllowIntroductions(data.allowIntroductions);
      } else {
        console.error("Failed to fetch introduction preferences");
      }
    } catch (error) {
      console.error("Error fetching introduction preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newValue: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/introduction-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowIntroductions: newValue,
        }),
      });

      if (response.ok) {
        setAllowIntroductions(newValue);
        toast.success(
          newValue
            ? "PacDuck introductions enabled!"
            : "PacDuck introductions disabled",
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Failed to update introduction preferences:", error);
      toast.error("Failed to update preferences. Please try again.");
      // Revert the switch if save failed
      setAllowIntroductions(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setAllowIntroductions(checked);
    updatePreferences(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🦆 PacDuck Introductions
        </CardTitle>
        <CardDescription>
          Control whether other users can request PacDuck to introduce them to
          you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-medium">Allow Introductions</h4>
            <p className="text-muted-foreground text-sm">
              When enabled, other users can request PacDuck to send introduction
              emails connecting you both
            </p>
          </div>
          <Switch
            checked={allowIntroductions}
            onCheckedChange={handleToggle}
            disabled={isLoading || isSaving}
          />
        </div>

        {!allowIntroductions && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 With introductions disabled, the &ldquo;Get PacDuck
              Intro&rdquo; button won&apos;t appear on your profile for other
              users. You can still request introductions to others who have this
              feature enabled.
            </p>
          </div>
        )}

        <div className="text-muted-foreground space-y-2 text-sm">
          <p>
            <strong>How PacDuck introductions work:</strong>
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Other users can click &ldquo;Get PacDuck Intro&rdquo; on your
              profile
            </li>
            <li>PacDuck analyzes both profiles to find common interests</li>
            <li>You both receive a personalized introduction email</li>
            <li>You can connect directly via email from there</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
