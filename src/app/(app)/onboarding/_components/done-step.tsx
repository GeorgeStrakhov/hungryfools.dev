"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface DoneStepProps {
  onFinish: () => void;
}

export function DoneStep({ onFinish }: DoneStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/PacDuck.png"
          alt="PacDuck"
          width={120}
          height={120}
        />
        <h1 className="text-2xl font-semibold">PacDuck says hooray!</h1>
        <p className="text-muted-foreground">
          You&apos;re all set. Go find someone to co‑vibe with.
        </p>
      </div>
      <div className="nav-buttons">
        <Button onClick={onFinish}>Go to directory</Button>
      </div>
    </div>
  );
}
