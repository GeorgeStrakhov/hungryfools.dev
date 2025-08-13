# Event tracking report

This document lists all PostHog events that have been automatically added to your Next.js application.

## Events by File

### src/components/landing/landing.tsx

- **github_signin_initiated**: Fired when a user clicks the 'Sign in with GitHub' button to start the authentication process.

### src/components/topbar.tsx

- **user-signed-out**: Triggered when a user clicks the 'Sign out' button from the user avatar dropdown.
- **sign-in-clicked**: Triggered when a user clicks the 'Sign in' button.

### src/components/ui/button.tsx

- (no automatic events; tracking should be added at call sites or via wrappers)

### src/components/ui/dialog.tsx

- **dialog_opened**: Fired when a user action causes a dialog to open.
- **dialog_closed**: Fired when a user action causes a dialog to close, such as clicking a close button, pressing the escape key, or clicking the overlay.

### src/components/ui/dropdown-menu.tsx

- **dropdown_menu_item_selected**: Fired when a user selects a standard item from a dropdown menu. The `variant` property indicates if the item is 'default' or 'destructive'.
- **dropdown_menu_checkbox_item_toggled**: Fired when a user toggles a checkbox item within a dropdown menu. The `checked` property indicates the new state of the checkbox after the toggle.

### src/components/ui/select.tsx

- **select_value_changed**: Fired when a user selects a new value from a dropdown menu. The selected value is captured in the 'value' property.

### src/components/ui/textarea.tsx

- **textarea-input-finished**: Fires when a user clicks away from the textarea, indicating they have finished their input. Captures the final length of the text.

## Events still awaiting implementation

- (human: you can fill these in)

---

Learn more about what to measure with PostHog and why: https://posthog.com/docs/new-to-posthog/getting-hogpilled
