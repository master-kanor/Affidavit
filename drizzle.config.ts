import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@[YOUR_SUPABASE_HOST]:5432/postgres",
  },
});