# Analytics Event Tracking Report

This document lists all analytics events implemented in the HungryFools.dev application using our centralized analytics system.

**Note:** Analytics tracking only initializes after users accept cookies via the consent banner. All events listed below will only fire after consent is given.

## 🏗️ Analytics Architecture

We use a centralized analytics system (`/src/lib/analytics.ts`) that provides:

- **Type-safe event tracking** with constants to prevent typos
- **User identification** for cohort analysis
- **Consistent API** across the entire application
- **PostHog integration** with EU data residency

## 📊 Event Categories

### Authentication & Session Management

- **`user_signed_in`**: Tracked when user completes GitHub OAuth signin
- **`user_signed_out`**: Tracked when user clicks sign out
- **`user_identified`**: Tracked when user identity is established in analytics
- **`sign_in_clicked`**: Tracked when user clicks sign in button
- **`sign_in_for_introduction`**: Tracked when user signs in to introduce themselves to another user
- **`github_signin_initiated`**: Tracked when GitHub OAuth flow begins

### Onboarding Funnel

- **`onboarding_started`**: Tracked when user enters onboarding flow (purpose step)
- **`onboarding_step_completed`**: Tracked for each onboarding step with progress percentage
- **`onboarding_completed`**: Tracked when user reaches the done step
- **`purpose_select`**: Tracked when user selects their purpose (with choices)
- **`vibe_complete`**: Tracked when user completes vibe selection step

### Profile & Project Management

- **`profile_viewed`**: Tracked when someone views a profile page (with owner detection)
- **`profile_edit_started`**: Available for tracking profile edit initiation
- **`profile_updated`**: Tracked when user saves profile changes
- **`project_viewed`**: Tracked when someone views a project page (with owner detection)
- **`project_created`**: Available for tracking new project creation
- **`project_updated`**: Available for tracking project updates

### Search & Discovery

- **`search_performed`**: Available for tracking search queries
- **`directory_search`**: Tracked when user searches from landing page
- **`search_result_clicked`**: Available for tracking search result clicks

### Social Features

- **`introduction_requested`**: Available for tracking introduction requests
- **`introduction_dialog_opened`**: Available for tracking introduction dialog usage

### UI Component Interactions

- **`dialog_opened`**: Tracked when any dialog opens
- **`dialog_closed`**: Tracked when any dialog closes
- **`dropdown_menu_item_selected`**: Tracked when dropdown menu items are selected
- **`dropdown_menu_checkbox_toggled`**: Tracked when dropdown checkboxes are toggled
- **`select_value_changed`**: Tracked when select dropdown values change
- **`textarea_input_finished`**: Tracked when user finishes textarea input (on blur)

## 🎯 Implementation Locations

### Core Analytics Components

- **`/src/lib/analytics.ts`**: Centralized analytics utility with all event constants
- **`/src/app/(app)/post-auth/analytics-identifier.tsx`**: User identification after signin
- **`/src/components/analytics/profile-view-tracker.tsx`**: Profile page view tracking
- **`/src/components/analytics/project-view-tracker.tsx`**: Project page view tracking

### Components with Analytics

- **`/src/components/topbar.tsx`**: Sign in/out events
- **`/src/components/landing/landing.tsx`**: Landing page search and signin events
- **`/src/components/profile/profile-form.tsx`**: Profile update events
- **`/src/components/profile/sign-in-to-introduce.tsx`**: Introduction signin events
- **`/src/app/(app)/onboarding/_components/`**: All onboarding step tracking
  - `purpose-step.tsx`: Purpose selection
  - `vibe-step.tsx`: Vibe completion
  - `done-step.tsx`: Onboarding completion
- **`/src/components/ui/`**: UI component interaction tracking
  - `dialog.tsx`: Dialog open/close events
  - `dropdown-menu.tsx`: Menu interaction events
  - `select.tsx`: Select value changes
  - `textarea.tsx`: Textarea completion events

## 🚧 Available for Implementation

The following events are defined in the analytics system but not yet fully implemented:

### Search Analytics

- Search performance tracking
- Search result click-through rates
- Query success metrics

### Navigation Tracking

- Page navigation patterns
- Link click tracking
- User flow analysis

### Settings & Preferences

- Settings page interactions
- Preference changes
- Account management actions

### Error & Performance Tracking

- API error monitoring
- Form validation errors
- Page load performance

### Additional Social Features

- Introduction dialog interactions
- Contact link clicks
- Social profile visits

## 📋 Next Steps

1. **Search Analytics**: Complete implementation of search event tracking
2. **Navigation Analytics**: Add page transition and link click tracking
3. **Error Tracking**: Implement comprehensive error and performance monitoring
4. **Settings Analytics**: Track user preference changes and settings usage

## 🔧 Adding New Events

To add a new event:

1. Add the event constant to `ANALYTICS_EVENTS` in `/src/lib/analytics.ts`
2. Use `analytics.track(ANALYTICS_EVENTS.EVENT_NAME, { data })` in your component
3. Update this documentation

Example:

```typescript
// In analytics.ts
NEW_FEATURE_USED: ("new_feature_used",
  // In component
  analytics.track(ANALYTICS_EVENTS.NEW_FEATURE_USED, {
    feature_name: "advanced_search",
    user_type: "premium",
  }));
```

---

_Last updated: August 20, 2025_
