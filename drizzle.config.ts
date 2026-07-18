import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://relayframe:relayframe-local@localhost:5432/relayframe",
  },
  strict: true,
  verbose: true,
});
