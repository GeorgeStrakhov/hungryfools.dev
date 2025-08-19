"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STEP_CONFIG } from "../_lib/steps";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useOnboardingWizard } from "../_context/wizard-context";
import { completeOnboardingAction } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DoneStepProps {
  onFinish: () => void;
}

export function DoneStep({ onFinish }: DoneStepProps) {
  const [userHandle, setUserHandle] = useState<string>("");
  const { data, finalize, finalizing } = useOnboardingWizard();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    // Poll a couple times briefly in case finalize just updated the handle
    const fetchOnce = async () => {
      try {
        const res = await fetch("/api/user/handle");
        const data = await res.json();
        if (active && data.handle) setUserHandle(data.handle);
      } catch (e) {
        console.error("Failed to fetch user handle:", e);
      }
    };
    fetchOnce();
    const t = setTimeout(fetchOnce, 300);
    const t2 = setTimeout(fetchOnce, 1000);
    return () => {
      active = false;
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const handleFinish = async () => {
    try {
      await finalize();
      router.replace("/directory");
    } catch (e) {
      const err = e as { message?: string };
      if (err?.message === "HANDLE_TAKEN") {
        toast.error("Handle taken. Please choose another.");
        router.replace("/onboarding/handle");
        return;
      }
      console.error("Failed to complete onboarding:", e);
      toast.error("Failed to complete onboarding. Please try again.");
    }
  };

  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Image src="/images/PacDuck.png" alt="PacDuck" width={120} height={120} />
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.done.title}</h1>
        {STEP_CONFIG.done.subtitle && (
          <p className="text-muted-foreground">{STEP_CONFIG.done.subtitle}</p>
        )}
      </div>

      {/* Success message */}
      <div className="mx-auto max-w-md rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
        <p className="font-medium">✨ Profile created successfully!</p>
        <p className="text-sm">Your profile is now live and discoverable</p>
      </div>

      {/* Next Steps */}
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <span>🚀</span>
            What&apos;s Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button onClick={handleFinish} className="h-auto justify-start p-4" size="lg" disabled={finalizing}>
              <Users className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Browse Directory</div>
                <div className="text-sm opacity-90">Find developers to collaborate with</div>
              </div>
            </Button>

            <Button variant="outline" asChild className="h-auto justify-start p-4" size="lg">
              <a href={userHandle ? `/u/${userHandle}/projects/new` : "#"}>
                <Plus className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Add More Projects</div>
                  <div className="text-sm opacity-70">Build your portfolio further</div>
                </div>
              </a>
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-muted-foreground text-sm">
              💡 <strong>Pro tip:</strong> Adding more projects increases your visibility and helps you
              connect with like-minded developers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Simple CTA as fallback */}
      <div className="text-muted-foreground text-sm">
        You can always manage your profile and projects from your settings later.
      </div>
    </div>
  );
}
