## HungryFools.dev — Product Requirements Document (PRD)

### 1) Overview
HungryFools.dev is a directory of AI‑first “vibecoder” developers who build fast. The product enables:
- Developers to sign in with GitHub and publish rich profiles (skills/stack, interests, projects, availability).
- Other developers to discover and contact collaborators.
- Companies to list themselves as vibecoder‑friendly (paid) and source talent.
- Great search via hybrid keyword + vector similarity and optional text‑to‑SQL.

Primary users: AI‑first developers; Secondary users: hiring managers/companies.

### 2) Goals and Non‑Goals
- Goals:
  - Fast, low‑friction onboarding via GitHub.
  - Clear, searchable profiles to drive discovery and collaboration/hiring.
  - High‑quality search and browsing UX.
  - Lightweight monetization via paid company listings.
- Non‑Goals (initially):
  - Complex ATS features; deep applicant tracking.
  - Messaging platform; we’ll start with external contact links.

### 3) Personas & Core Jobs
- Developer (Job: showcase profile, find collaborators, get hired).
- Company (Job: list brand as friendly, source candidates, get inbound interest).

### 4) Staged Development Plan

#### Stage 0 — Foundation (DONE/In Progress)
- Auth: GitHub OAuth with Auth.js v5, Drizzle ORM, Neon Postgres; database sessions.
- UI foundation: Tailwind + shadcn; landing page.
- Top bar login/logout and avatar dropdown.
Acceptance: User can sign in and see avatar; DB has `user`, `account`, `session` rows.

#### Stage 1 — Developer Profiles MVP (Create/Edit/View)
- Profile model: fields (display name, headline, bio, skills/stack, interests, location, links: GitHub/X/site, availability flags).
- Pages:
  - Create/Edit Profile (server actions or API routes).
  - Public Profile page (SEO‑friendly).
- Directory: Basic list of profiles with pagination/sort.
- Showcase: simple way to list things shipped (mini cards with title/link/one‑liner). This is core to the product.
- Analytics: instrument sign‑in, profile create/update, profile view.
Acceptance: Signed‑in dev can create/edit profile; profile appears in directory and is viewable publicly; can add at least one showcase item; analytics events recorded.

#### Stage 2 — Search & Filters for Profiles
- Search (v1): keyword search over name/headline/skills with simple ranking.
- Filters: availability (hire/collabs/hiring), skills/stack chips, location.
- Contact: external links (GitHub/email/X) on profile; optional “mailto” CTA.
- Analytics: instrument search queries, filter usage, profile click‑throughs (CTR).
Acceptance: Users can filter and search profiles; relevant analytics captured.

#### Stage 3 — Analytics & Observability (Hardening)
- Implement product analytics provider and dashboards (e.g., PostHog or Vercel Web Analytics).
- Track events: auth_login, profile_create, profile_update, profile_view, directory_view, search_query, filter_apply, profile_click, outbound_click.
- Add basic performance/error monitoring (e.g., Vercel + Sentry optional).
Acceptance: Events flow to dashboards; basic funnels visible; no PII logged unintentionally.

#### Stage 4 — Company Listings (Monetization v1, later)
- Company model: name, description, website, logo, “vibecoder‑friendly” badge, optional openings link.
- Paywall: simple checkout (Stripe) for listing activation; Admin can verify/feature.
- Company directory page; badges on profiles that work there (optional later).
Acceptance: Company can purchase listing and goes live upon payment success.

#### Stage 5 — Search Quality v1 (Hybrid)
- Embeddings pipeline for profiles (e.g., OpenAI/AWS Bedrock/Fireworks). Store vectors in Postgres extension or external vector DB; keep simple first.
- Hybrid search: combine keyword ranking + vector similarity; scoring and result merge.
- Query UX: search bar with suggestions; highlight matches.
Acceptance: Hybrid search returns clearly better results vs. keyword‑only in simple tests.

#### Stage 6 — Admin & Moderation
- Admin role (`user.isAdmin`) gated UI.
- Admin pages: review/feature profiles, review company listings, revoke/disable content.
- Basic audit logs (who/when for key changes).
Acceptance: Admin can feature/hide entries; actions reflected in UI.

#### Stage 7 — Text‑to‑SQL (Stretch)
- Natural language to search filter or SQL for advanced discovery.
- Safety: constrain to read‑only queries and whitelisted columns.
Acceptance: NL queries produce useful filtered results reliably for top use cases.

### 5) Data Model (initial)
- auth: `user`, `account`, `session`, `verificationToken`, `authenticator` (Auth.js Drizzle schema; `user.isAdmin` boolean).
- app content:
  - `profile` (1:1 user): name, headline, bio, skills (array/json), interests (array/json), location, links, availability flags, timestamps.
  - `profile_expertise_other` (optional): non‑dev expertise/identity tags (array/json) — e.g., musician, teacher, writer, climber, runner.
  - `profile_showcase` (1:many user): title, link (GitHub/Live), one‑liner summary, createdAt.
  - `company`: name, description, website, logo, isActive, plan/meta, timestamps.
  - `payment` (optional later): provider, amount, status, timestamps.
  - `profile_embedding` (later): userId, vector.

### 6) Key Flows
- Sign in → create/edit profile → directory visibility → search & filter → contact.
- Company checkout → listing active → appears in company directory.

### 7) Acceptance Criteria by Stage
- Clearly listed under each stage above; must be demoable on Vercel preview.

### 8) Technical Plan (high‑level)
- Next.js App Router; server actions for CRUD.
- Drizzle ORM migrations; Neon Postgres.
- Auth.js v5 database sessions; `SessionProvider` on client.
- Tailwind + shadcn for UI; minimal, responsive, dark default.
- Search v1: SQL ILIKE over indexed columns; later hybrid with embeddings using pgvector on Neon (EU region).
- Payments: Stripe Checkout (company listings); secure webhooks.
- Analytics: PostHog (EU data residency) as primary product analytics; client + server event capture, GDPR‑aware.

### 9) Metrics
- Supply‑side: profiles created, profile completeness, active users/week.
- Demand‑side: searches/run, profile views, outbound clicks (contact link CTR).
- Revenue: company listing conversion rate, MRR.

### 10) Risks & Mitigations
- Low‑quality profiles → add lightweight quality checks and featured section.
- Abuse/spam → admin moderation tools and rate limits.
- Search quality → iterate on embeddings/hybrid scoring.

### 11) Decisions (closed)
- Vector store: pgvector on Neon (EU).
- Messaging: email only (no in‑app messaging for now).
- Company verification/badges: not in initial scope.

### 12) Compliance & Privacy (GDPR)
- Data residency: Neon DB (EU), PostHog (EU) configured.
- Consent: cookie banner for analytics; block analytics until consent (functional cookies only by default). Provide settings to revoke/change consent.
- Policies: publish Privacy Policy and Terms of Service (see `docs/LEGAL-PRIVACY.md`).
- Data minimization: avoid PII in analytics; use userId/handle only.
- Rights: implement data export/delete process on request; document contact email.
- Retention: define retention for logs/analytics; regularly purge unneeded data.
- Subprocessors: document PostHog and Vercel as subprocessors with EU processing.

### 13) Milestones & Timeline (suggested)
- Week 1: Stage 1 (Profiles MVP) end‑to‑end.
- Week 2: Stage 2 filters + Stage 3 payment scaffolding.
- Week 3: Stage 3 go‑live + Stage 4 hybrid search prototype.
- Week 4: Stage 5 admin tooling, polish, deploy.


