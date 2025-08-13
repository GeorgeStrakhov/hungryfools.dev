import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CookiePreferences } from "@/components/settings/cookie-preferences";
import { DataControls } from "@/components/settings/data-controls";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="hf-container mx-auto max-w-4xl space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and privacy settings
        </p>
      </div>

      <div className="space-y-6">
        <CookiePreferences />
        <DataControls />
      </div>
    </div>
  );
}
