"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BannerDialogProps {
  bannerId: string;
  headline: string;
  message: string;
}

export function BannerDialog({
  bannerId,
  headline,
  message,
}: BannerDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this banner
    const storageKey = `banner-seen-${bannerId}`;
    const hasSeenBanner = sessionStorage.getItem(storageKey);

    if (!hasSeenBanner) {
      // Show the banner after a small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [bannerId]);

  const handleDismiss = () => {
    // Mark banner as seen in sessionStorage
    const storageKey = `banner-seen-${bannerId}`;
    sessionStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
        <div className="mb-4 flex justify-center">
          <Image
            src="/video/pacduck_only.gif"
            alt="PacDuck Alert"
            width={60}
            height={60}
            className="h-[60px] w-[60px]"
            unoptimized
          />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg sm:text-xl">
            {headline}
          </AlertDialogTitle>
          <AlertDialogDescription className="px-2 text-center text-sm whitespace-pre-wrap sm:text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={handleDismiss} className="w-full">
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
