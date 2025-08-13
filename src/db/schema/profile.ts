import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export type ProjectMedia = {
  url: string;
  type: "image" | "video";
  filename: string;
  size: number;
  key: string; // S3 key for deletion
};

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url"), // Optional live/repo link
    oneliner: text("oneliner"), // Short tagline
    description: text("description"), // Longer description
    media: jsonb("media").$type<ProjectMedia[]>().default([]),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    {
      userSlugIdx: uniqueIndex("project_user_slug_idx").on(
        table.userId,
        table.slug,
      ),
    },
  ],
);
