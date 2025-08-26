import { Pool } from 'pg';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP TABLE IF EXISTS usuarios CASCADE`);
    await client.query(`DROP TABLE IF EXISTS proveedores CASCADE`);
    await client.query(`DROP TABLE IF EXISTS bodegas CASCADE`);
    await client.query(`DROP TABLE IF EXISTS productos CASCADE`);
    await client.query(`DROP TABLE IF EXISTS inventario CASCADE`);
    await client.query(`DROP TABLE IF EXISTS movimientos CASCADE`);
    await client.query(`DROP TABLE IF EXISTS clientes CASCADE`);
    await client.query(`DROP TABLE IF EXISTS configuracion CASCADE`);
    await client.query('COMMIT');
    console.log('Dropped spanish tables');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error dropping tables:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
