const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main(){
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try{
    const exists = async (name) => {
      const r = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [name]);
      return r.rows[0].exists;
    };

    const english = await exists('inventory') && await exists('products') && await exists('warehouses');
    const spanish = await exists('inventario') && await exists('productos') && await exists('bodegas');

    const rows = [];
    if (english){
      const res = await client.query(`SELECT p.code as product_code, p.name as product_name, w.name as warehouse_name, i.current_stock as quantity
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        JOIN warehouses w ON w.id = i.warehouse_id
        ORDER BY p.code`);
      for (const r of res.rows) rows.push(r);
    } else if (spanish){
      const res = await client.query(`SELECT p.codigo as product_code, p.nombre as product_name, b.nombre as warehouse_name, i.cantidad_actual as quantity
        FROM inventario i
        JOIN productos p ON p.id = i.producto_id
        JOIN bodegas b ON b.id = i.bodega_id
        ORDER BY p.codigo`);
      for (const r of res.rows) rows.push(r);
    } else {
      console.warn('No recognized inventory tables found.');
      return;
    }

    const outDir = path.resolve(process.cwd(), 'attached_assets');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'inventory.csv');
    const header = 'product_code,product_name,warehouse_name,quantity\n';
    const lines = rows.map(r => `${String(r.product_code).replace(/\n|\r|,/g,' ')} , ${String(r.product_name).replace(/\n|\r|,/g,' ')} , ${String(r.warehouse_name).replace(/\n|\r|,/g,' ')} , ${r.quantity}`).join('\n');
    fs.writeFileSync(outPath, header + lines, 'utf8');
    console.log('Wrote', outPath, 'rows:', rows.length);
  }catch(e){
    console.error('Export failed', e);
  }finally{
    await client.release();
    await pool.end();
  }
}

main();
