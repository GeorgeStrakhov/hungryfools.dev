import posthog from "posthog-js";

/**
 * Centralized analytics tracking utility
 * Provides type-safe event tracking with consistent naming
 */

// Event names as constants to avoid typos
export const ANALYTICS_EVENTS = {
  // Authentication & Session
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",
  USER_IDENTIFIED: "user_identified",
  SIGN_IN_CLICKED: "sign_in_clicked",
  SIGN_IN_FOR_INTRODUCTION: "sign_in_for_introduction",
  GITHUB_SIGNIN_INITIATED: "github_signin_initiated",

  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_ABANDONED: "onboarding_abandoned",
  PURPOSE_SELECT: "purpose_select",
  VIBE_COMPLETE: "vibe_complete",

  // Profile
  PROFILE_VIEWED: "profile_viewed",
  PROFILE_EDIT_STARTED: "profile_edit_started",
  PROFILE_UPDATED: "profile_updated",
  PROFILE_IMAGE_UPLOADED: "profile_image_uploaded",

  // Projects
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_DELETED: "project_deleted",
  PROJECT_VIEWED: "project_viewed",
  PROJECT_MEDIA_UPLOADED: "project_media_uploaded",
  PROJECT_LINK_CLICKED: "project_link_clicked",

  // Search & Discovery
  SEARCH_PERFORMED: "search_performed",
  SEARCH_RESULT_CLICKED: "search_result_clicked",
  SEARCH_FILTER_APPLIED: "search_filter_applied",
  SEARCH_SORT_CHANGED: "search_sort_changed",
  SEARCH_PAGINATION_USED: "search_pagination_used",
  DIRECTORY_SEARCH: "directory_search",

  // Social Features
  INTRODUCTION_REQUESTED: "introduction_requested",
  INTRODUCTION_DIALOG_OPENED: "introduction_dialog_opened",
  SOCIAL_LINK_CLICKED: "social_link_clicked",
  PROFILE_LINK_COPIED: "profile_link_copied",

  // Navigation
  NAVIGATION_CLICKED: "navigation_clicked",
  MOBILE_MENU_TOGGLED: "mobile_menu_toggled",
  PAGE_VIEWED: "page_viewed",

  // Settings
  SETTINGS_VIEWED: "settings_viewed",
  SETTINGS_UPDATED: "settings_updated",
  INTRODUCTION_PREFERENCES_TOGGLED: "introduction_preferences_toggled",
  ACCOUNT_DELETION_INITIATED: "account_deletion_initiated",
  DATA_EXPORT_REQUESTED: "data_export_requested",

  // Companies
  COMPANY_VIEWED: "company_viewed",
  COMPANY_SUBMISSION_STARTED: "company_submission_started",
  COMPANY_SUBMISSION_COMPLETED: "company_submission_completed",
  COMPANY_LINK_CLICKED: "company_link_clicked",

  // UI Component Interactions
  DIALOG_OPENED: "dialog_opened",
  DIALOG_CLOSED: "dialog_closed",
  DROPDOWN_MENU_ITEM_SELECTED: "dropdown_menu_item_selected",
  DROPDOWN_MENU_CHECKBOX_TOGGLED: "dropdown_menu_checkbox_toggled",
  SELECT_VALUE_CHANGED: "select_value_changed",
  TEXTAREA_INPUT_FINISHED: "textarea_input_finished",

  // Errors & Performance
  API_ERROR: "api_error",
  FORM_VALIDATION_ERROR: "form_validation_error",
  SEARCH_PERFORMANCE: "search_performance",
  PAGE_LOAD_TIME: "page_load_time",
} as const;

// Type for event names
export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// User properties interface
export interface UserProperties {
  userId?: string;
  email?: string;
  handle?: string;
  displayName?: string;
  onboardingCompleted?: boolean;
  profileCompleteness?: number;
  projectCount?: number;
  hasProfileImage?: boolean;
  availableForHire?: boolean;
  openToCollab?: boolean;
  isHiring?: boolean;
  accountAgeDays?: number;
  location?: string;
  skillsCount?: number;
  interestsCount?: number;
}

// Analytics utility class
class Analytics {
  private isInitialized = false;

  constructor() {
    // Check if PostHog is available
    if (typeof window !== "undefined" && posthog) {
      this.isInitialized = true;
    }
  }

  /**
   * Track a custom event
   */
  track(
    eventName: AnalyticsEvent | string,
    properties?: Record<string, unknown>,
  ) {
    if (!this.isInitialized) return;

    try {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  }

  /**
   * Identify a user with properties
   */
  identify(userId: string, properties?: UserProperties) {
    if (!this.isInitialized) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error("Analytics identify error:", error);
    }
  }

  /**
   * Set user properties without identifying
   */
  setUserProperties(properties: UserProperties) {
    if (!this.isInitialized) return;

    try {
      posthog.setPersonProperties(properties);
    } catch (error) {
      console.error("Analytics setUserProperties error:", error);
    }
  }

  /**
   * Track a page view
   */
  pageView(pageName?: string, properties?: Record<string, unknown>) {
    if (!this.isInitialized) return;

    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const path =
        typeof window !== "undefined" ? window.location.pathname : "";

      this.track(ANALYTICS_EVENTS.PAGE_VIEWED, {
        page_name: pageName,
        page_url: url,
        page_path: path,
        ...properties,
      });
    } catch (error) {
      console.error("Analytics pageView error:", error);
    }
  }

  /**
   * Track search performance metrics
   */
  trackSearchPerformance(
    searchType: "directory" | "projects",
    query: string,
    resultCount: number,
    timing?: {
      vector?: number;
      keywords?: number;
      reranking?: number;
      total: number;
    },
  ) {
    this.track(ANALYTICS_EVENTS.SEARCH_PERFORMANCE, {
      search_type: searchType,
      query,
      query_length: query.length,
      result_count: resultCount,
      has_results: resultCount > 0,
      timing_total_ms: timing?.total,
      timing_vector_ms: timing?.vector,
      timing_keywords_ms: timing?.keywords,
      timing_reranking_ms: timing?.reranking,
      used_reranking: timing?.reranking ? timing.reranking > 0 : false,
    });
  }

  /**
   * Track API errors
   */
  trackError(
    errorType: "api" | "form" | "general",
    errorMessage: string,
    context?: Record<string, unknown>,
  ) {
    const eventName =
      errorType === "api"
        ? ANALYTICS_EVENTS.API_ERROR
        : errorType === "form"
          ? ANALYTICS_EVENTS.FORM_VALIDATION_ERROR
          : "error_occurred";

    this.track(eventName, {
      error_message: errorMessage,
      error_type: errorType,
      ...context,
    });
  }

  /**
   * Track onboarding progress
   */
  trackOnboardingStep(
    step: string,
    stepNumber: number,
    isCompleted: boolean,
    properties?: Record<string, unknown>,
  ) {
    this.track(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
      step_name: step,
      step_number: stepNumber,
      is_completed: isCompleted,
      ...properties,
    });
  }

  /**
   * Track navigation interactions
   */
  trackNavigation(
    item: string,
    type: "topbar" | "mobile" | "footer" | "sidebar",
    destination?: string,
  ) {
    this.track(ANALYTICS_EVENTS.NAVIGATION_CLICKED, {
      navigation_item: item,
      navigation_type: type,
      destination_url: destination,
    });
  }

  /**
   * Reset user (on sign out)
   */
  reset() {
    if (!this.isInitialized) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error("Analytics reset error:", error);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Helper functions for common tracking scenarios
export const trackSearch = (
  type: "directory" | "projects",
  query: string,
  resultCount: number,
  filters?: Record<string, unknown>,
) => {
  analytics.track(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
    search_type: type,
    query,
    query_length: query.length,
    result_count: resultCount,
    has_results: resultCount > 0,
    filters_applied: filters ? Object.keys(filters).length > 0 : false,
    ...filters,
  });
};

export const trackProfileView = (
  profileHandle: string,
  isOwnProfile: boolean,
  profileUserId?: string,
) => {
  analytics.track(ANALYTICS_EVENTS.PROFILE_VIEWED, {
    profile_handle: profileHandle,
    is_own_profile: isOwnProfile,
    profile_user_id: profileUserId,
  });
};

export const trackProjectView = (
  projectSlug: string,
  projectName: string,
  ownerHandle: string,
  isOwnProject: boolean,
) => {
  analytics.track(ANALYTICS_EVENTS.PROJECT_VIEWED, {
    project_slug: projectSlug,
    project_name: projectName,
    owner_handle: ownerHandle,
    is_own_project: isOwnProject,
  });
};

export const trackSocialLinkClick = (
  linkType: "github" | "twitter" | "website" | "email",
  profileHandle: string,
  destination?: string,
) => {
  analytics.track(ANALYTICS_EVENTS.SOCIAL_LINK_CLICKED, {
    link_type: linkType,
    profile_handle: profileHandle,
    destination_url: destination,
  });
};
