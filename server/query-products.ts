import { Pool } from 'pg';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, code, name, attachment_url, created_at FROM products ORDER BY created_at DESC LIMIT 10');
    console.log('Products rows:', JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
