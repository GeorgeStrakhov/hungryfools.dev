import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  headline: text("headline").notNull(),
  message: text("message").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  authOnly: boolean("auth_only").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
