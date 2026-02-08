/**
 * Programmatic migration runner for production deployments.
 *
 * Usage:
 *   npx tsx server/migrate.ts
 *
 * This script can be run as part of deployment pipelines to apply
 * pending database migrations before starting the server.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("🚀 Starting database migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
