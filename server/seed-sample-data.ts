import { storage } from './storage';
import { pool, db } from './db';
import { sql, eq } from 'drizzle-orm';
import { categories, suppliers, warehouses, products } from '@shared/schema';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no definido. Aborta.');
    process.exit(1);
  }
  console.log('Insertando datos de ejemplo (idempotente)...');

  // Helpers idempotentes
  async function ensureCategory(name: string, description?: string) {
    const existing = await db.select().from(categories).where(eq(categories.name, name));
    if (existing.length) return existing[0];
    return await storage.createCategory({ name, description } as any);
  }

  async function ensureSupplier(data: { name: string; taxId?: string; contact?: string; phone?: string }) {
    const existing = await db.select().from(suppliers).where(eq(suppliers.name, data.name));
    if (existing.length) return existing[0];
    return await storage.createSupplier(data as any);
  }

  async function ensureWarehouse(data: { name: string; location?: string }) {
    const existing = await db.select().from(warehouses).where(eq(warehouses.name, data.name));
    if (existing.length) return existing[0];
    return await storage.createWarehouse(data as any);
  }

  async function ensureProduct(data: any) {
    const existing = await db.select().from(products).where(eq(products.code, data.code));
    if (existing.length) return existing[0];
    return await storage.createProduct(data);
  }

  // Categorías
  const categorias = [] as any[];
  for (const name of ['Alimentos', 'Bebidas', 'Limpieza']) {
    categorias.push(await ensureCategory(name, `${name} genérica`));
  }

  // Proveedores
  const proveedores = [] as any[];
  for (const p of [
    { name: 'Proveedor Andes', taxId: '76.123.456-7', contact: 'ventas@andes.cl', phone: '+56 2 555 1111' },
    { name: 'Distribuidora Sur', taxId: '77.987.654-3', contact: 'contacto@sur.cl', phone: '+56 63 555 2222' },
  ]) {
    proveedores.push(await ensureSupplier(p));
  }

  // Bodegas
  const bodegas = [] as any[];
  for (const name of ['Central', 'Norte']) {
    bodegas.push(await ensureWarehouse({ name, location: `Ubicación ${name}` }));
  }

  // Productos
  const prods = [] as any[];
  for (const p of [
    { code: 'P-ARROZ-1', name: 'Arroz 1kg', unit: 'kg', categoryId: categorias[0].id, supplierId: proveedores[0].id, purchasePrice: '900', salePrice: '1200', minStock: 10 },
    { code: 'P-JUGO-1', name: 'Jugo Naranja 1L', unit: 'l', categoryId: categorias[1].id, supplierId: proveedores[1].id, purchasePrice: '600', salePrice: '950', minStock: 15 },
    { code: 'P-DETER-1', name: 'Detergente 3L', unit: 'l', categoryId: categorias[2].id, supplierId: proveedores[1].id, purchasePrice: '2500', salePrice: '3900', minStock: 5 },
  ]) {
    prods.push(await ensureProduct(p));
  }

  // Stock inicial solo si aún no hay stock (para no inflar en re-ejecuciones)
  for (const prod of prods) {
    for (const wh of bodegas) {
      const current = await storage.getProductStock(prod.id, wh.id);
      if (current === 0) {
        await storage.updateInventory(prod.id, wh.id, Math.floor(Math.random()*50)+10);
      }
    }
  }

  // Resumen
  const [[{ count: totalCategorias }], [{ count: totalProveedores }], [{ count: totalBodegas }], [{ count: totalProductos }]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(suppliers),
    db.select({ count: sql<number>`count(*)` }).from(warehouses),
    db.select({ count: sql<number>`count(*)` }).from(products),
  ]);

  console.log('Datos de ejemplo listos.');
  console.log(`Categorías: ${totalCategorias}, Proveedores: ${totalProveedores}, Bodegas: ${totalBodegas}, Productos: ${totalProductos}`);
  if (pool) await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
