"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { saveShowcaseAction } from "@/app/onboarding/actions";
import { toast } from "sonner";

export default function ShowcaseStep() {
  const router = useRouter();
  const params = useSearchParams();
  const handle = params.get("handle") || "";
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [summary, setSummary] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Brag a bit: coolest thing you vibe-shipped?</h1>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="Link (GitHub/Live)" value={link} onChange={(e) => setLink(e.target.value)} />
      <Textarea placeholder="One-liner summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              await saveShowcaseAction({ title, link, summary });
              router.push(`/onboarding/done?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              toast.error("Could not save. Try again.");
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/onboarding/expertise?handle=${encodeURIComponent(handle)}`)}>Back</Button>
      </div>
      <div className="text-center">
        <Button variant="outline" onClick={() => router.push(`/onboarding/done?handle=${encodeURIComponent(handle)}`)}>Skip for now</Button>
      </div>
    </div>
  );
}


