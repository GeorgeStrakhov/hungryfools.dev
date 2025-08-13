"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CookiePreferences() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasAnalyticsConsent(document.cookie.includes("cookieConsent=true"));
  }, []);

  const toggleAnalyticsConsent = () => {
    if (hasAnalyticsConsent) {
      document.cookie =
        "cookieConsent=false; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
      setHasAnalyticsConsent(false);
      router.push("/cookies-declined");
    } else {
      document.cookie =
        "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
      setHasAnalyticsConsent(true);
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cookie Preferences</CardTitle>
        <CardDescription>
          Manage your cookie and analytics preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Essential Cookies</h4>
            <p className="text-muted-foreground text-sm">
              Required for the site to function
            </p>
          </div>
          <div className="text-muted-foreground text-sm">Always enabled</div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Analytics Cookies</h4>
            <p className="text-muted-foreground text-sm">
              Help us improve our services
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleAnalyticsConsent}>
            {hasAnalyticsConsent ? "Disable" : "Enable"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
