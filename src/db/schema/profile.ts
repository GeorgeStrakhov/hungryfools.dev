import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";

export type ProfileLinks = {
  github?: string;
  x?: string;
  website?: string;
  email?: string;
};

export type ProfileAvailability = {
  hire?: boolean;
  collab?: boolean;
  hiring?: boolean;
};

export const profiles = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  displayName: text("displayName"),
  headline: text("headline"),
  bio: text("bio"),
  skills: jsonb("skills").$type<string[]>(),
  interests: jsonb("interests").$type<string[]>(),
  location: text("location"),
  links: jsonb("links").$type<ProfileLinks>(),
  availability: jsonb("availability").$type<ProfileAvailability>(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
