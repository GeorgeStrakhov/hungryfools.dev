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
    async session({ session, user }) {
      if (session.user && user) {
        // augment at runtime; types are added via declaration file
        session.user.id = user.id;
        // augment at runtime; types are added via declaration file
        session.user.isAdmin = user.isAdmin ?? false;
      }
      return session;
    },
  },
});
