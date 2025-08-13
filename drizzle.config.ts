import { defineConfig } from "drizzle-kit";
import { config as dotenvConfig } from "dotenv";
import { existsSync } from "node:fs";

// Load .env.local first if present, then fallback to .env
if (existsSync(".env.local")) {
  dotenvConfig({ path: ".env.local" });
}
dotenvConfig();

export default defineConfig({
  schema: ["./src/db/schema/auth.ts", "./src/db/schema/profile.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
