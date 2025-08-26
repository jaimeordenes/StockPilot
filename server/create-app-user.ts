import { Pool } from 'pg';
import bcrypt from 'bcrypt';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const username = 'jordenes';
    const email = 'jordenes@example.com';
    const passwordPlain = 'Jaop*1985';
    const hashed = await bcrypt.hash(passwordPlain, 10);

    const res = await client.query(
      `INSERT INTO users (email, username, password, first_name, last_name, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET
         username = EXCLUDED.username,
         password = EXCLUDED.password,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active
       RETURNING id, email, username, role`,
      [email, username, hashed, 'Jorden', 'Es', 'administrator', true]
    );

    console.log('User upserted:', JSON.stringify(res.rows[0]));
    console.log('Plain password (for login):', passwordPlain);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
