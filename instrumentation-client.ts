import posthog from "posthog-js";

// Only initialize PostHog if user has given consent
if (typeof window !== "undefined") {
  // Check for consent on client side
  const hasConsent = document.cookie.includes("cookieConsent=true");

  if (hasConsent) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
      debug: process.env.NODE_ENV === "development",
    });
  }
}
