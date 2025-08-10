## Legal, Privacy, and Compliance Plan (EU/GDPR)

This document outlines the legal/compliance steps for HungryFools.dev operating in the EU with EU-hosted data (Neon, PostHog).

### 1) Data Residency
- Databases and analytics are hosted in EU regions (Neon, PostHog EU). Avoid transferring personal data outside the EU.

### 2) Personal Data Processed
- Accounts: `user` table from Auth.js (name, email, image) — minimal required for auth and profiles.
- Profiles: public profile content created by users.
- Analytics: pseudonymous IDs (userId/handle); avoid emails/PII.

### 3) Consent (Cookies/Tracking)
- Implement a cookie banner and consent management:
  - Default to functional cookies only; block analytics until user consents.
  - Provide a persistent settings UI to revoke/change consent.
  - Store consent state (local storage or cookie) and respect Do Not Track.

### 4) Privacy Policy & Terms of Service
- Publish pages under `/privacy` and `/terms` covering:
  - What data we collect and why (auth, profiles, analytics).
  - Data processors (Vercel, Neon, PostHog), EU data residency, and links to their policies.
  - Legal bases (consent for analytics, contract for account/profile functionality).
  - Data subject rights: access, rectification, erasure, restriction, portability, objection.
  - Contact information for data requests.
  - Retention: durations for logs, analytics, and account data.

### 5) Data Subject Requests (DSR)
- Implement an internal process (email channel) to handle export/delete requests:
  - Export: provide user’s account + profile data in machine-readable format (JSON).
  - Delete: remove account/profile data; disable analytics identifiers.

### 6) Security & Access Controls
- Restrict DB access to least privilege; rotate credentials.
- Use HTTPS everywhere; secure cookies; CSRF protections via Auth.js.
- Basic audit trail for admin actions (Stage 6).

### 7) Data Minimization & Retention
- Collect only essential data for the features.
- Define retention (e.g., analytics raw events retained 12 months; logs 30 days; account data until deletion request).

### 8) Subprocessors
- Document PostHog (EU), Neon (EU), Vercel (hosting, EU/EEA) as subprocessors; update if others added.

### 9) Future Considerations
- Add Records of Processing Activities (RoPA) as product grows.
- Consider DPA agreements with vendors; ensure SCCs where needed.


