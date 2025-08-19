import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [GitHub],
  session: { strategy: "database" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Capture GitHub username on first sign-in/link
      try {
        if (account?.provider === "github" && user?.id) {
          const githubLogin = (profile as any)?.login as string | undefined;
          if (githubLogin) {
            await db
              .update(users)
              .set({ githubUsername: githubLogin })
              .where(eq(users.id, user.id));
          }
        }
      } catch (e) {
        // Non-blocking
        console.error("Failed to persist githubUsername:", e);
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        // augment at runtime; types are added via declaration file
        session.user.id = user.id;
        // augment at runtime; types are added via declaration file
        session.user.isAdmin = user.isAdmin ?? false;
        // expose github username to consumers
        // @ts-expect-error - runtime augmentation
        session.user.githubUsername = (user as any).githubUsername ?? null;
        // Debug: log github username presence in session
        try {
          // @ts-expect-error - runtime augmentation
          const gh = session.user.githubUsername;
          console.log(
            "🟣 [AUTH] session githubUsername:",
            gh ?? null,
            "for user:",
            session.user.id,
          );
        } catch {}
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        if (account?.provider === "github" && user?.id) {
          const githubLogin = (profile as any)?.login as string | undefined;
          if (githubLogin) {
            await db
              .update(users)
              .set({ githubUsername: githubLogin })
              .where(eq(users.id, user.id));
            console.log("🟢 [AUTH] stored githubUsername on signIn:", githubLogin);
          }
        }
      } catch (e) {
        console.error("Failed to persist githubUsername in events.signIn:", e);
      }
    },
  },
});
