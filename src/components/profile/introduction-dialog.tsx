"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface IntroductionDialogProps {
  targetHandle: string;
  targetDisplayName: string;
}

export function IntroductionDialog({
  targetHandle,
  targetDisplayName,
}: IntroductionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntroduction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/introductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: targetHandle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send introduction");
      }

      toast.success(
        `PacDuck is introducing you to ${targetDisplayName}! Check your email 📧`,
      );

      // Show commonalities if available
      if (data.commonalities && data.commonalities.length > 0) {
        setTimeout(() => {
          toast.info(
            `PacDuck found these connections: ${data.commonalities.slice(0, 2).join(", ")}${
              data.commonalities.length > 2 ? "..." : ""
            }`,
          );
        }, 1000);
      }

      setOpen(false);
    } catch (error) {
      console.error("Introduction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send introduction. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Get PacDuck Intro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🦆 PacDuck Introduction
          </DialogTitle>
          <DialogDescription className="text-left">
            PacDuck will analyze your profiles, find awesome connections, and
            send you both a fun introduction email! No boring &ldquo;contact
            this user&rdquo; nonsense - just pure vibes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              <li>• PacDuck analyzes both your profiles & projects</li>
              <li>• Finds your shared interests and skills</li>
              <li>• Sends you both a personalized intro email</li>
              <li>• You can connect directly from there! 🎉</li>
            </ul>
          </div>

          <p className="text-muted-foreground text-xs">
            Introducing you to <strong>{targetDisplayName}</strong> (@
            {targetHandle})
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Maybe Later
          </Button>
          <Button onClick={handleIntroduction} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 animate-spin">🦆</span>
                PacDuck is working...
              </>
            ) : (
              <>
                <span className="mr-2">🦆</span>
                Let&apos;s Connect!
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
