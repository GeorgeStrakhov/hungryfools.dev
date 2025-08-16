import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  integer,
  vector,
} from "drizzle-orm/pg-core";
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
  profileImage: text("profileImage"), // Custom uploaded profile image (optional)
  skills: jsonb("skills").$type<string[]>(),
  interests: jsonb("interests").$type<string[]>(),
  location: text("location"),
  links: jsonb("links").$type<ProfileLinks>(),
  availability: jsonb("availability").$type<ProfileAvailability>(),
  showcase: boolean("showcase").notNull().default(false),
  // Raw onboarding data for state persistence
  vibeSelections: jsonb("vibeSelections").$type<string[]>(),
  vibeText: text("vibeText"),
  stackSelections: jsonb("stackSelections").$type<string[]>(),
  stackText: text("stackText"),
  expertiseSelections: jsonb("expertiseSelections").$type<string[]>(),
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
    url: text("url"), // Optional live/demo link
    githubUrl: text("githubUrl"), // Optional GitHub repository link
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

// Embedding tables for intelligent search
export const profileEmbeddings = pgTable(
  "profile_embeddings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // BGE-M3 produces 1024-dimensional vectors
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    // Track content changes to avoid unnecessary regeneration
    contentHash: text("contentHash").notNull(),
    // Store the content used for debugging/inspection
    contentPreview: text("contentPreview").notNull(),
    // Metadata
    embeddingModel: text("embeddingModel").notNull().default("@cf/baai/bge-m3"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("profile_embeddings_user_idx").on(table.userId),
    // HNSW index for fast similarity search
    embeddingIdx: index("profile_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
);

export const projectEmbeddings = pgTable(
  "project_embeddings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(), // Denormalized for easier joins
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    contentHash: text("contentHash").notNull(),
    contentPreview: text("contentPreview").notNull(),
    embeddingModel: text("embeddingModel").notNull().default("@cf/baai/bge-m3"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdx: uniqueIndex("project_embeddings_project_idx").on(
      table.projectId,
    ),
    embeddingIdx: index("project_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
);

// Track embedding generation for monitoring/debugging
export const embeddingLogs = pgTable("embedding_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text("entityType").notNull(), // 'profile' or 'project'
  entityId: text("entityId").notNull(),
  action: text("action").notNull(), // 'created', 'updated', 'failed'
  contentHash: text("contentHash"),
  error: text("error"),
  processingTimeMs: integer("processingTimeMs"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
