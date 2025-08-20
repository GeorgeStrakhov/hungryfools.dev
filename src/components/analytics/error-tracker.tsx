"use client";

import { useEffect } from "react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function ErrorTracker() {
  useEffect(() => {
    // Track global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      analytics.track(ANALYTICS_EVENTS.API_ERROR, {
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        error_type: "javascript_error",
      });
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.track(ANALYTICS_EVENTS.API_ERROR, {
        error_message: String(event.reason),
        error_type: "unhandled_promise_rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null; // This component doesn't render anything
}
