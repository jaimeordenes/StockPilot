const { Pool } = require('pg');

async function main(){
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try{
    // insert a couple of clients
  await client.query(`INSERT INTO clientes (nombre, rut, contacto, telefono, correo, direccion) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (rut) DO NOTHING`, ['Cliente Uno','C1','Contacto1','+56000000001','cliente1@example.com','Calle 1']);
  await client.query(`INSERT INTO clientes (nombre, rut, contacto, telefono, correo, direccion) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (rut) DO NOTHING`, ['Cliente Dos','C2','Contacto2','+56000000002','cliente2@example.com','Calle 2']);

    // create two movements (entry and exit) using existing product and warehouse ids
    const prodRes = await client.query('SELECT id FROM productos LIMIT 1');
    const prodId = prodRes.rows[0].id;
    const bodegaRes = await client.query('SELECT id FROM bodegas LIMIT 1');
    const bodegaId = bodegaRes.rows[0].id;

  // use the existing admin user id (2)
  const adminUserId = 2;
  await client.query(`INSERT INTO movimientos (producto_id, bodega_origen, bodega_destino, tipo, cantidad, usuario_id, motivo, documento_asociado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [prodId, null, bodegaId, 'entry', 50, adminUserId, 'Inicial stock', 'DOC-INIT']);
  await client.query(`INSERT INTO movimientos (producto_id, bodega_origen, bodega_destino, tipo, cantidad, usuario_id, motivo, documento_asociado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [prodId, bodegaId, null, 'exit', 5, adminUserId, 'Venta', 'INV-001']);

    console.log('Extra seed applied');
  }catch(e){
    console.error('Extra seed failed', e);
  }finally{
    await client.release();
    await pool.end();
  }
}

main();
