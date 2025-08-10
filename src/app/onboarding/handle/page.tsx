"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { createOrUpdateProfileAction } from "@/app/profile/edit/profile.actions";
import { toast } from "sonner";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function HandleStep() {
  const router = useRouter();
  const { data: session } = useSession();
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [debounceId, setDebounceId] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) return;
    if (!handle) {
      const candidateFromName = session.user.name ? slugify(session.user.name) : "";
      const emailLocal = (session.user as any).email?.split("@")[0] || "";
      const candidateFromEmail = emailLocal ? slugify(emailLocal) : "";
      const fallback = session.user.id ? `user-${session.user.id.slice(0, 8)}` : "";
      setHandle(candidateFromName || candidateFromEmail || fallback);
    }
  }, [session?.user]);

  // Debounced auto-save of handle
  useEffect(() => {
    if (!handle) return;
    if (!session?.user?.id) return;
    if (debounceId) clearTimeout(debounceId);
    const id = setTimeout(async () => {
      try {
        setSaving(true);
        await createOrUpdateProfileAction({ handle, displayName: session.user?.name || "" } as any);
      } catch (e) {
        // silent
      } finally {
        setSaving(false);
      }
    }, 500);
    setDebounceId(id);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pick your handle</h1>
      <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="your-handle" />
      <div className="flex flex-row-reverse items-center justify-between">
        <Button
          onClick={async () => {
            try {
              setSaving(true);
              await createOrUpdateProfileAction({ handle, displayName: session?.user?.name || "" } as any);
              router.push(`/onboarding/location?handle=${encodeURIComponent(handle)}`);
            } catch (e) {
              if ((e as Error).message === "HANDLE_TAKEN") {
                toast.error("That handle is taken. Try a different one.");
              } else {
                toast.error("Could not save handle. Try again.");
              }
            } finally {
              setSaving(false);
            }
          }}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => router.push("/onboarding/purpose")}>Back</Button>
      </div>
    </div>
  );
}


