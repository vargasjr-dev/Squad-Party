import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

let _db: NodePgDatabase<typeof schema> | undefined;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

/** @deprecated Use getDb() for lazy initialization */
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as never)[prop];
  },
});
