## Authentication Plan (Auth.js v5 + GitHub OAuth + Drizzle + Neon Postgres)

This plan outlines how we will integrate sign-in with GitHub using Auth.js v5 in a Next.js App Router project, persist users/sessions in Neon Postgres (v17), and manage schema with Drizzle.

### Objectives
- Enable login with GitHub via Auth.js v5 handlers.
- Persist users and accounts in Postgres using Drizzle ORM and the official Auth.js Drizzle adapter.
- Start with JWT sessions (default). Database sessions are optional; we can enable later if needed.
- Maintain a simple `app_users` table to store app-specific user profile data (e.g., name, email, GitHub avatar URL) synced on first sign-in and on subsequent sign-ins.
 - Maintain a simple `app_users` table to store app-specific user profile data (e.g., name, email, GitHub avatar URL) synced on first sign-in and on subsequent sign-ins.
 - Include an `isAdmin` boolean on `app_users` to enable admin-only UI later.
- Expose convenient server helpers (auth(), signIn, signOut) and protect routes.

### References
- Auth.js v5 Installation (Next.js): [authjs.dev Installation](https://authjs.dev/getting-started/installation?framework=Next.js)
- Drizzle Adapter: [authjs.dev Drizzle Adapter](https://authjs.dev/getting-started/adapters/drizzle)
- GitHub Provider: [authjs.dev GitHub Provider](https://authjs.dev/getting-started/providers/github)

---

### Environment Variables
Add to `.env.local` (you will supply values):
- `AUTH_SECRET` (use `npx auth secret` to generate)
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `DATABASE_URL` (Neon Postgres connection string)

Optional (Next.js URL for callbacks in dev/prod):
- `NEXTAUTH_URL` (not strictly required with v5, but helpful in some setups)

---

### Packages
- `next-auth@beta` (Auth.js v5)
- `drizzle-orm`
- `@auth/drizzle-adapter`
- `drizzle-kit` (CLI)
- `pg` (Postgres driver)

---

### Database and Schema Strategy

We will use two sets of tables:
1) Auth.js adapter tables (managed by our Drizzle schema definitions):
   - Required for OAuth: `users`, `accounts`
   - Optional: `sessions` (only if we switch to database sessions) and `verificationTokens` (only if we add Magic Links)

2) Application user profile table (optional but recommended for clear separation):
   - `app_users` with columns:
     - `id` (PK, uuid or varchar) referencing auth `users.id`
     - `name` (text)
     - `email` (text, unique)
     - `avatarUrl` (text)
     - `isAdmin` (boolean, default false)
     - `createdAt`, `updatedAt` (timestamps)

Rationale: Auth.js `users` table is controlled by the adapter (and includes `name`, `email`, `image`). We keep our own `app_users` for app-specific fields and future growth without coupling to adapter internals.

---

### Drizzle Setup
1) Configure Drizzle with Postgres:
   - `src/db/index.ts` creates a Postgres pool using `pg` and exports a Drizzle client.
2) Define schemas:
   - `src/db/schema/auth.ts` with tables compatible with the Auth.js Drizzle adapter (`users`, `accounts`, and optionally `sessions`, `verificationTokens`).
   - `src/db/schema/app.ts` for `app_users` table.
3) Create Drizzle Kit config (`drizzle.config.ts`) pointing at `DATABASE_URL` and schema files.
4) Generate and apply migrations using Drizzle Kit.

---

### Auth.js Configuration
Create `auth.ts` at the project root (`/auth.ts`):
- Import `NextAuth` from `next-auth` and `GitHub` provider from `next-auth/providers/github`.
- Provide `providers: [GitHub]`.
- Add the Drizzle adapter: `adapter: DrizzleAdapter(db)`.
- Implement callbacks:
  - `signIn`: ensure email presence; allowlist domains later if needed.
  - `jwt`/`session`: include essential fields (id, name, image) on the token/session.
- Export `{ handlers, auth, signIn, signOut }`.

Add route handler:
- `src/app/api/auth/[...nextauth]/route.ts` exporting `{ GET, POST } = handlers`.

Optional middleware for session keep-alive:
- `middleware.ts`: `export { auth as middleware } from "@/auth"` with matcher if we protect specific routes.

---

### First Sign-in Profile Sync
On first successful GitHub sign-in:
- Extract `name`, `email`, `image` from the profile/provider account.
- Upsert into `app_users` using the `user.id` produced by the adapter, to store `avatarUrl` and other app-specific fields.
- On subsequent sign-ins, update `avatarUrl`/`name` if changed.

Implementation detail:
- Use Auth.js `events.linkAccount` or `callbacks.signIn` to perform the upsert via Drizzle, ensuring we only write when we have a valid `user.id`/account link.

---

### UI/UX
- Add a `Sign in with GitHub` button (client component) that calls `signIn("github")`.
- Show a `UserButton`/avatar in the header if authenticated.
- Protect routes by using `await auth()` in server components or middleware for redirects.

---

### Migrations
Steps:
1) `drizzle-kit generate` to create SQL migrations from schema definitions.
2) `drizzle-kit push` or `drizzle-kit migrate` to apply to Neon (using `DATABASE_URL`).

We will run generation and migration locally; Neon applies them to the remote database.

---

### Deliverables (Implementation Order)
1) Install packages and add `.env.local` keys (you will provide secrets).
2) Drizzle config + schema files + migration.
3) `auth.ts` with GitHub provider, Drizzle adapter, and route handler.
4) Profile upsert on sign-in to `app_users`.
5) Add basic UI: Sign in/out buttons, show avatar/name.
6) Protect any private routes with middleware or server checks.

---

### Open Questions
- Should we enforce email domain restrictions (e.g., private beta)?
- Any required user roles/permissions at this stage?
- Should we add magic links or credentials later, or keep GitHub-only for now?


