import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";

export const companies = pgTable("company", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logoUrl"),
  url: text("url"),
  contactEmail: text("contactEmail"),
  oneliner: text("oneliner"),
  description: text("description"),
  isActive: boolean("isActive").notNull().default(false),
  createdByUserId: text("createdByUserId").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
