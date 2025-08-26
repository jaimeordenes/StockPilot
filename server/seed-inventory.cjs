const { Pool } = require('pg');

async function main(){
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try{
    const exists = async (name) => {
      const r = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [name]);
      return r.rows[0].exists;
    };

  const hasUsers = await exists('users');
  const hasUsuarios = await exists('usuarios');
  const hasSuppliers = await exists('suppliers');
  const hasProveedores = await exists('proveedores');
  const hasProducts = await exists('products');
  const hasProductos = await exists('productos');

  // Prefer the language that has supplier/product tables present.
  const english = (hasSuppliers && hasProducts) || (hasUsers && !hasUsuarios && (hasSuppliers || hasProducts));
  const spanish = (hasProveedores && hasProductos) || (hasUsuarios && !hasUsers && (hasProveedores || hasProductos));

    console.log('Detected schema:', english ? 'english' : (spanish ? 'spanish' : 'unknown'));

    if (!english && !spanish) {
      console.warn('No recognized tables found (users or usuarios). Aborting.');
      return;
    }

    // Choose table names and columns
    const T = english ? {
      suppliers: 'suppliers', warehouses: 'warehouses', products: 'products', inventory: 'inventory', users: 'users'
    } : {
      suppliers: 'proveedores', warehouses: 'bodegas', products: 'productos', inventory: 'inventario', users: 'usuarios'
    };

    // Helper: upsert supplier
    async function upsertSupplier(name, taxId, contact){
      if (english){
        // try find by tax_id then by name
        const found = await client.query(`SELECT * FROM ${T.suppliers} WHERE tax_id = $1 OR name = $2 LIMIT 1`, [taxId, name]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.suppliers} SET contact = $1, email = $2 WHERE id = $3`, [contact, name.toLowerCase().replace(/\s+/g,'') + '@example.com', row.id]);
          const updated = await client.query(`SELECT * FROM ${T.suppliers} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.suppliers} (name, tax_id, contact, email) VALUES ($1,$2,$3,$4) RETURNING *`, [name, taxId, contact, name.toLowerCase().replace(/\s+/g,'') + '@example.com']);
        return r.rows[0];
      } else {
        // spanish: prefer rut if present
        const found = await client.query(`SELECT * FROM ${T.suppliers} WHERE rut = $1 OR nombre = $2 LIMIT 1`, [taxId, name]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.suppliers} SET contacto = $1, correo = $2 WHERE id = $3`, [contact, name.toLowerCase().replace(/\s+/g,'') + '@example.com', row.id]);
          const updated = await client.query(`SELECT * FROM ${T.suppliers} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.suppliers} (nombre, rut, contacto, correo) VALUES ($1,$2,$3,$4) RETURNING *`, [name, taxId, contact, name.toLowerCase().replace(/\s+/g,'') + '@example.com']);
        return r.rows[0];
      }
    }

    async function upsertWarehouse(name, location){
      if (english){
        const found = await client.query(`SELECT * FROM ${T.warehouses} WHERE name = $1 LIMIT 1`, [name]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.warehouses} SET location = $1 WHERE id = $2`, [location, row.id]);
          const updated = await client.query(`SELECT * FROM ${T.warehouses} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.warehouses} (name, location) VALUES ($1,$2) RETURNING *`, [name, location]);
        return r.rows[0];
      } else {
        const found = await client.query(`SELECT * FROM ${T.warehouses} WHERE nombre = $1 LIMIT 1`, [name]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.warehouses} SET ubicacion = $1 WHERE id = $2`, [location, row.id]);
          const updated = await client.query(`SELECT * FROM ${T.warehouses} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.warehouses} (nombre, ubicacion) VALUES ($1,$2) RETURNING *`, [name, location]);
        return r.rows[0];
      }
    }

    async function upsertProduct(code, name, supplierId, minStock, price){
      if (english){
        const found = await client.query(`SELECT * FROM ${T.products} WHERE code = $1 LIMIT 1`, [code]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.products} SET name = $1, supplier_id = $2, min_stock = $3, sale_price = $4 WHERE id = $5`, [name, supplierId, minStock, price, row.id]);
          const updated = await client.query(`SELECT * FROM ${T.products} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.products} (code, name, supplier_id, min_stock, sale_price) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [code, name, supplierId, minStock, price]);
        return r.rows[0];
      } else {
        const found = await client.query(`SELECT * FROM ${T.products} WHERE codigo = $1 LIMIT 1`, [code]);
        if (found.rows.length > 0) {
          const row = found.rows[0];
          await client.query(`UPDATE ${T.products} SET nombre = $1, proveedor_id = $2, stock_min = $3, precio_venta = $4 WHERE id = $5`, [name, supplierId, minStock, price, row.id]);
          const updated = await client.query(`SELECT * FROM ${T.products} WHERE id = $1`, [row.id]);
          return updated.rows[0];
        }
        const r = await client.query(`INSERT INTO ${T.products} (codigo, nombre, proveedor_id, stock_min, precio_venta) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [code, name, supplierId, minStock, price]);
        return r.rows[0];
      }
    }

    async function upsertInventory(productId, warehouseId, qty){
      if (english){
        const r = await client.query(`INSERT INTO ${T.inventory} (product_id, warehouse_id, current_stock) VALUES ($1,$2,$3) ON CONFLICT (product_id, warehouse_id) DO UPDATE SET current_stock = EXCLUDED.current_stock RETURNING *`, [productId, warehouseId, qty]);
        return r.rows[0];
      } else {
        const r = await client.query(`INSERT INTO ${T.inventory} (producto_id, bodega_id, cantidad_actual) VALUES ($1,$2,$3) ON CONFLICT (producto_id, bodega_id) DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual RETURNING *`, [productId, warehouseId, qty]);
        return r.rows[0];
      }
    }

    // Create sample data
    const supplier = await upsertSupplier('ACME Supplies', 'ACM123', 'Contacto ACME');
    console.log('Supplier:', supplier);

    const warehouse = await upsertWarehouse('Bodega Central', 'Ciudad Principal');
    console.log('Warehouse:', warehouse);

    // Determine supplier id / product supplier foreign key name
    const supplierId = supplier.id || supplier.id;
    const warehouseId = warehouse.id || warehouse.id;

    const products = [];
    products.push(await upsertProduct('P-001', 'Tornillo M4', supplierId, 10, 0.12));
    products.push(await upsertProduct('P-002', 'Tuerca M4', supplierId, 20, 0.08));
    products.push(await upsertProduct('P-003', 'Arandela 8mm', supplierId, 5, 0.02));

    console.log('Products:', products.map(p => ({id: p.id || p.id, code: p.codigo || p.code, name: p.nombre || p.name})));

    // Insert inventory rows
    for (const p of products){
      const pid = p.id || p.id;
      const qty = 100;
      const inv = await upsertInventory(pid, warehouseId, qty);
      console.log('Inventory for', p.id || p.id, '=>', inv);
    }

    console.log('Seed complete.');
  }catch(e){
    console.error('Seed failed', e);
  }finally{
    await client.release();
    await pool.end();
  }
}

main();
