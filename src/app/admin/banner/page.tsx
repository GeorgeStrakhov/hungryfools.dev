import { db } from "@/db";
import { banners } from "@/db/schema/banner";
import { createBanner, toggleBannerActive, deleteBanner } from "./actions";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Megaphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function AdminBannerPage() {
  // Get all banners, ordered by newest first
  const allBanners = await db
    .select()
    .from(banners)
    .orderBy(desc(banners.createdAt));

  const activeBanner = allBanners.find((b) => b.isActive);
  const recentBanners = allBanners.slice(0, 5); // Show last 5 banners

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Site Banner</h1>
        <p className="text-muted-foreground mt-2">
          Set urgent messages to display to site visitors
        </p>
      </div>

      {/* Current Status */}
      <Alert className={activeBanner ? "border-green-500" : ""}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Current Status</AlertTitle>
        <AlertDescription>
          {activeBanner
            ? `Active banner: "${activeBanner.headline}"`
            : "No banner is currently active"}
        </AlertDescription>
      </Alert>

      {/* Banner Form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          await createBanner({
            headline: String(formData.get("headline") || ""),
            message: String(formData.get("message") || ""),
            authOnly: formData.get("authOnly") === "on",
            isActive: formData.get("isActive") === "on",
          });
        }}
        className="space-y-6"
      >
        <div className="space-y-4 rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Create New Banner</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              placeholder="System Maintenance Notice"
              defaultValue=""
              required
            />
            <p className="text-muted-foreground text-sm">
              Short title for the banner message
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="We are currently performing scheduled maintenance. Some features may be temporarily unavailable."
              rows={4}
              defaultValue=""
              required
            />
            <p className="text-muted-foreground text-sm">
              Detailed message to display to users
            </p>
          </div>

          <div className="flex items-center justify-between border-t py-3">
            <div className="space-y-0.5">
              <Label htmlFor="authOnly" className="cursor-pointer text-base">
                Authenticated Users Only
              </Label>
              <p className="text-muted-foreground text-sm">
                Only show this banner to signed-in users
              </p>
            </div>
            <Switch id="authOnly" name="authOnly" defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between border-t py-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="cursor-pointer text-base">
                Activate Banner
              </Label>
              <p className="text-muted-foreground text-sm">
                Display this banner to site visitors
              </p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={true} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Create New Banner</Button>
        </div>
      </form>

      {/* Banner History */}
      {recentBanners.length > 0 && (
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Banners</h3>
          <div className="space-y-3">
            {recentBanners.map((banner) => (
              <div
                key={banner.id}
                className={`space-y-2 rounded-lg border p-4 ${
                  banner.isActive ? "border-green-500 bg-green-50/5" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{banner.headline}</h4>
                    <p className="text-muted-foreground text-sm">
                      {banner.message}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <span>
                        Created:{" "}
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </span>
                      {banner.authOnly && (
                        <span className="italic">(Auth users only)</span>
                      )}
                      {banner.isActive && (
                        <span className="font-medium text-green-600">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!banner.isActive && (
                      <form
                        action={async () => {
                          "use server";
                          await toggleBannerActive(banner.id, true);
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Activate
                        </Button>
                      </form>
                    )}
                    {banner.isActive && (
                      <form
                        action={async () => {
                          "use server";
                          await toggleBannerActive(banner.id, false);
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Deactivate
                        </Button>
                      </form>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        await deleteBanner(banner.id);
                      }}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
