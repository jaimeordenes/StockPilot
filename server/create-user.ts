import { Pool } from 'pg';
import bcrypt from 'bcrypt';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stockpilot';
  const pool = new Pool({ connectionString: DATABASE_URL });

  const client = await pool.connect();
  try {
    // create users table minimally if not exists (simple schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY,
        email varchar UNIQUE,
        username varchar UNIQUE,
        password varchar,
        first_name varchar,
        last_name varchar,
        profile_image_url varchar,
        role varchar DEFAULT 'viewer',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    const username = 'jordenes';
    const plainPassword = 'Jaop*1985';
    const hashed = await bcrypt.hash(plainPassword, 10);

    // upsert user
    await client.query(`
      INSERT INTO users (id, username, password, email, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, updated_at = now();
    `, ['user-' + username, username, hashed, 'jordenes@example.com', 'Jorden', 'Es', 'administrator']);

    console.log('User created/updated: jordenes');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
