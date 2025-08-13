import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL is not set. Drizzle will not be able to connect.");
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool);
