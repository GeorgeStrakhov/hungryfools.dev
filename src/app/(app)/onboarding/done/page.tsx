"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DoneStep() {
  const router = useRouter();
  return (
    <div className="text-center space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Image src="/images/PacDuck.png" alt="PacDuck" width={120} height={120} />
        <h1 className="text-2xl font-semibold">PacDuck says hooray!</h1>
        <p className="text-muted-foreground">You’re all set. Go find someone to co‑vibe with.</p>
      </div>
      <Button onClick={() => router.replace("/directory")}>Go to directory</Button>
    </div>
  );
}


