## Phase 1 — Developer Profiles MVP (Create/Edit/View) + Analytics

### Scope
- Build end-to-end profiles for developers: create, edit, public view, and basic directory.
- Add basic keyword search and filters over profiles.
- Instrument analytics for key actions and views.

Out of scope: company listings/paywall, hybrid/vector search, admin UI.

### Goals & Acceptance Criteria
- Signed-in user can create and edit their profile with fields below.
- Public profile at `/u/[handle]` is accessible and SEO-friendly.
- Directory page lists profiles with basic pagination/sort and simple filters.
- Search bar filters the directory by keyword (name, headline, skills).
- Analytics events recorded for sign-in, profile create/update/view, directory view, search, filter apply, click-through to external links.

### Data Model (app)
- Table: `profile` (1:1 with `user.id`)
  - `userId` (text, PK/FK → `user.id`)
  - `handle` (text, unique, URL-safe; default from GitHub login if available)
  - `displayName` (text)
  - `headline` (text)
  - `bio` (text)
  - `skills` (jsonb array of strings)
  - `interests` (jsonb array of strings)
  - `location` (text)
  - `links` (jsonb: { github, x, website, email })
  - `availability` (jsonb: { hire: boolean, collab: boolean, hiring: boolean })
  - `createdAt` (timestamptz, default now)
  - `updatedAt` (timestamptz, default now)

Indexes:
- unique(`handle`)
- GIN over `skills` (later); for v1 use ILIKE on text fields; add trigram or FTS later.

Migration plan:
- Add `src/db/schema/profile.ts` and generate migrations.

### API & Server Actions
- Prefer Next.js Server Actions for CRUD to keep UI simple and co-located.
- Validation via `zod` schemas (length limits, URL/email validation, allowed arrays, trim/normalize).
- Normalization:
  - `handle`: lowercase, kebab/slug, unique.
  - `links`: force https where applicable; strip tracking params.
  - `skills`/`interests`: dedupe, lowercase, max 30 items each, item length cap (e.g., 32).

Server actions (examples):
- `createOrUpdateProfile(formData)`
- `getOwnProfile()`
- `getPublicProfileByHandle(handle)`
- `searchProfiles({ q, skills, availability, location, page, sort })`

### Pages & Components
- `/profile/edit` (protected)
  - Form with inputs for fields above; preview card; server action submit; toasts.
- `/u/[handle]`
  - Public profile: avatar (from `user.image`), displayName, headline, skills, interests, links, availability chips, bio.
- `/directory` (browse/search)
  - Search input, filter chips, list with cards, pagination.
- Shared UI
  - `ProfileCard`, `TagChips`, `AvailabilityBadges`, `ProfileForm`.

URL strategy
- Prefer `/u/[handle]` for public permalinks; fallback to `/u/[userId]` if handle missing.

### Analytics (initial)
Tool: PostHog (EU). Use client SDK as in `src/components/topbar.tsx` and add a minimal server event helper for server-side events.

Events & properties
- `auth_login` { provider, userId }
- `profile_create` { userId }
- `profile_update` { userId, changedFields }
- `profile_view` { profileUserId, handle, referrer }
- `directory_view` { page }
- `search_query` { q, results, latencyMs }
- `filter_apply` { skills[], availability[], location }
- `profile_click` { targetUserId, handle, position }
- `outbound_click` { type: github|x|website|email, handle }

Privacy
- No PII beyond userId/handle; avoid sending emails. Respect Do Not Track; gate analytics behind consent (cookie banner) and provide settings to revoke.

### Validation & Security
- Zod validation on server; reject oversized payloads (e.g., 16KB limit).
- Encode bio safely (no HTML); render as plain text/markdown-lite if needed.
- Rate-limit edits (e.g., 30/min per user) later.

### Testing & QA
- Unit: zod schemas; normalization utilities.
- Integration: server actions (create/update/search).
- E2E (manual for now):
  - Sign in → create profile → edit → view public page.
  - Directory shows the profile; search by skill returns it.
  - Links work and record `outbound_click`.

### Milestones (1–2 weeks)
1) Schema + migrations for `profile` (day 1).
2) `/profile/edit` form + server actions (days 2–3).
3) Public profile `/u/[handle]` (day 4).
4) Directory `/directory` + basic search/filters (days 5–6).
5) Analytics wiring + dashboards (day 7).
6) Buffer, polish, deploy (day 8).

### Risks
- Handle uniqueness collisions → add suffix fallback, allow change.
- Skills taxonomy sprawl → acceptable for v1; can suggest common tags later.
- Search relevance → iterate post-launch.


