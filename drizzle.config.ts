import { defineConfig } from "drizzle-kit";

<<<<<<< HEAD
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
=======
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@[YOUR_SUPABASE_HOST]:5432/postgres",
  },
});
>>>>>>> github/main
