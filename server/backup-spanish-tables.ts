import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    const tables = ['usuarios','proveedores','bodegas','productos','inventario','movimientos','clientes','configuracion'];
    const outDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const t of tables) {
      try {
        const res = await client.query(`SELECT * FROM ${t}`);
        const file = path.join(outDir, `${t}.json`);
        fs.writeFileSync(file, JSON.stringify({ table: t, rowCount: res.rows.length, rows: res.rows }, null, 2));
        // also save column metadata
        const cols = await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
        fs.writeFileSync(path.join(outDir, `${t}_schema.json`), JSON.stringify(cols.rows, null, 2));
        console.log(`Backed up table ${t} -> ${file} (${res.rows.length} rows)`);
      } catch (e) {
        if (e instanceof Error) {
          console.warn(`Skipping ${t}:`, e.message);
        } else {
          console.warn(`Skipping ${t}: unknown error`);
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
