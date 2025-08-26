import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Export variables; assign based on DATABASE_URL presence.
export let pool: any = undefined;
export let db: any = undefined;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — DB client will be unavailable. Set DATABASE_URL to enable Postgres-backed storage.');
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}