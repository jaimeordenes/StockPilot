import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const source = path.resolve(process.cwd(), 'test-upload.txt');
    if (!fs.existsSync(source)) {
      console.log('No source test file found at', source);
      process.exit(1);
    }

    const filename = crypto.randomBytes(8).toString('hex');
    const dest = path.join(uploadsDir, filename);
    fs.copyFileSync(source, dest);
    const attachmentUrl = `/uploads/${filename}`;

    const insertSql = `INSERT INTO productos (codigo, nombre, descripcion, unidad, precio_compra, precio_venta, attachment_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;

    const values = ['TEST-SKU-' + Date.now(), 'Producto de prueba', 'Insertado por script de prueba', 'unidad', 10.5, 15.0, attachmentUrl];
    const res = await client.query(insertSql, values as any);
    console.log('INSERTED:', JSON.stringify(res.rows[0], null, 2));

    // fetch back by id
    const id = res.rows[0].id;
    const sel = await client.query('SELECT id, codigo, nombre, attachment_url FROM productos WHERE id = $1', [id]);
    console.log('SELECT:', JSON.stringify(sel.rows[0], null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
