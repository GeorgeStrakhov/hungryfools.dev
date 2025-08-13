## Authentication Plan (Auth.js v5 + GitHub OAuth + Drizzle + Neon Postgres)

This plan outlines how we will integrate sign-in with GitHub using Auth.js v5 in a Next.js App Router project, persist users/sessions in Neon Postgres (v17), and manage schema with Drizzle.

### Objectives

- Enable login with GitHub via Auth.js v5 handlers.
- Persist users, accounts, and sessions in Postgres using Drizzle ORM and the official Auth.js Drizzle adapter.
- Use database sessions (recommended for control and revocation).
- Add `isAdmin` boolean on `user` to enable admin-only UI later.
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

We use the Auth.js recommended Drizzle schema with singular table names:

- `user` (includes `id`, `name`, `email`, `emailVerified`, `image`, `isAdmin`)
- `account`
- `session` (database sessions)
- `verificationToken` (for magic links; present even if unused now)
- `authenticator` (for WebAuthn; present even if unused now)

---

### Drizzle Setup

1. Configure Drizzle with Postgres:
   - `src/db/index.ts` creates a Postgres pool using `pg` and exports a Drizzle client.
2. Define schema in `src/db/schema/auth.ts` using the Auth.js example (singular names) plus `user.isAdmin`.
3. Drizzle Kit config (`drizzle.config.ts`) loads env and points at `DATABASE_URL` and schema file.
4. Generate and apply migrations using Drizzle Kit.

---

### Auth.js Configuration

Create `auth.ts` at the project root (`/auth.ts`):

- Import `NextAuth` and `GitHub` provider.
- Use Drizzle adapter with our schema tables: `adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: account, sessionsTable: session, verificationTokensTable: verificationToken })`.
- Set `session: { strategy: "database" }`.
- Export `{ handlers, auth, signIn, signOut }`.

Add route handler:

- `src/app/api/auth/[...nextauth]/route.ts` exporting `{ GET, POST } = handlers`.

Optional middleware for session keep-alive:

- `middleware.ts`: `export { auth as middleware } from "@/auth"` with matcher if we protect specific routes.

---

### User Profile Data

Auth.js stores `name`, `email`, and `image` on the `user` table. We added `isAdmin` to `user` for future admin UI. If we need more app-specific fields later, we can extend `user` or add separate tables.

---

### UI/UX

- `SessionProvider` wraps the app in `layout.tsx`.
- Top bar shows: Sign in button when logged out; avatar dropdown with Sign out when logged in.
- Protect routes by using `await auth()` in server components or middleware for redirects.

---

### Migrations

Steps:

1. `pnpm run db:generate` to create SQL migrations from schema definitions.
2. `pnpm run db:migrate` to apply to Neon (using `DATABASE_URL`).

We will run generation and migration locally; Neon applies them to the remote database.

---

### Deliverables (Implementation Order)

1. Install packages and add `.env.local` keys (you will provide secrets).
2. Drizzle config + schema files + migration.
3. `auth.ts` with GitHub provider, Drizzle adapter, database sessions, and route handler.
4. Add UI: `SessionProvider`, top bar with Sign in/out and avatar.
5. Protect any private routes with middleware or server checks.

---

### Open Questions

- Should we enforce email domain restrictions (e.g., private beta)?
- Any required user roles/permissions at this stage?
- Should we add magic links or credentials later, or keep GitHub-only for now?

---

## Admin Authentication for API Routes

### Overview

We have a reusable admin authentication middleware for protecting admin-only API routes. This ensures consistent authentication and authorization checks across all admin endpoints.

### Location

`src/lib/api/admin-auth.ts`

### Usage

#### Basic Usage with `requireAdminAuth()`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authResult = await requireAdminAuth();
  if (!authResult.isValid) {
    return authResult.response;
  }

  // authResult.userId is now available if needed
  const adminUserId = authResult.userId;

  // Your admin-only logic here
  return NextResponse.json({ success: true });
}
```

#### Alternative: Using the `withAdminAuth()` Wrapper

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api/admin-auth";

export const POST = withAdminAuth(async (userId, request: NextRequest) => {
  // userId is guaranteed to be a valid admin user ID
  // Your admin-only logic here

  return NextResponse.json({ success: true });
});
```

### How It Works

1. Checks if the user is authenticated via session
2. Verifies the user has `isAdmin = true` in the database
3. Returns appropriate error responses:
   - 401 Unauthorized - if not logged in
   - 403 Forbidden - if logged in but not an admin
   - 500 Internal Server Error - if auth check fails

### Benefits

- **DRY Principle**: No need to duplicate auth/admin checks in every route
- **Consistent Error Handling**: Same error responses across all admin endpoints
- **Type Safety**: TypeScript interfaces ensure proper usage
- **Maintainable**: Changes to admin auth logic only need to be made in one place

### Example Routes Using This Middleware

- `/api/admin/test-embeddings` - Testing interface for embeddings service
- Future admin API routes can use the same pattern
