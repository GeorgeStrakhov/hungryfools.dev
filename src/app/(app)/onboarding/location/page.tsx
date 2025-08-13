"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrUpdateProfileAction } from "@/app/profile/edit/profile.actions";
import { toast } from "sonner";

export default function LocationStep() {
  const router = useRouter();
  const params = useSearchParams();
  const handle = params.get("handle") || "";
  const [location, setLocation] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (!cancelled) {
          const city = data?.city || "";
          const country = data?.country_name || "";
          const guess = [city, country].filter(Boolean).join(", ");
          if (guess) setLocation(guess);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Where are you based?</h1>
      <Input placeholder="City, Country or Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              await createOrUpdateProfileAction({ location } as any);
              router.push(`/onboarding/vibe?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              toast.error("Could not save location");
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/onboarding/handle?handle=${encodeURIComponent(handle)}`)}>Back</Button>
      </div>
    </div>
  );
}


