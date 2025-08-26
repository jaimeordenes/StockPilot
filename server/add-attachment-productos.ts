import { Pool } from 'pg';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(1024);");
    console.log('Column attachment_url ensured on productos');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
