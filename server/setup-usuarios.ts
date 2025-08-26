import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const sqlPath = path.resolve(process.cwd(), 'server', 'init-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);

    // Ensure at least one password column exists. Older DBs may have 'contraseña_hash' (with ñ).
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena_hash VARCHAR(255);`);

    // detect which columns exist
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name IN ('contraseña_hash','contrasena_hash')
    `);
    const cols = colRes.rows.map((r: any) => r.column_name);

    const username = 'jordenes';
    const passwordPlain = 'Jaop*1985';
    const hashed = await bcrypt.hash(passwordPlain, 10);

    if (cols.length === 0) {
      // fallback: ensure contrasena_hash exists then use it
      await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena_hash VARCHAR(255);`);
      await client.query(
        `INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, estado)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (correo) DO UPDATE SET contrasena_hash = EXCLUDED.contrasena_hash, nombre = EXCLUDED.nombre, rol = EXCLUDED.rol;`,
        ['Jorden Es', `${username}@example.com`, hashed, 'administrator', true]
      );
    } else if (cols.length === 1) {
      const col = cols[0];
      const insertSql = `INSERT INTO usuarios (nombre, correo, ${col}, rol, estado) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (correo) DO UPDATE SET ${col} = EXCLUDED.${col}, nombre = EXCLUDED.nombre, rol = EXCLUDED.rol;`;
      await client.query(insertSql, ['Jorden Es', `${username}@example.com`, hashed, 'administrator', true]);
    } else {
      // both columns exist; set both to the hashed value to satisfy any NOT NULL constraints
      const insertSql = `INSERT INTO usuarios (nombre, correo, "contraseña_hash", contrasena_hash, rol, estado) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (correo) DO UPDATE SET "contraseña_hash" = EXCLUDED."contraseña_hash", contrasena_hash = EXCLUDED.contrasena_hash, nombre = EXCLUDED.nombre, rol = EXCLUDED.rol;`;
      await client.query(insertSql, ['Jorden Es', `${username}@example.com`, hashed, hashed, 'administrator', true]);
    }

    console.log('Esquema aplicado y usuario jordenes creado/actualizado');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
