import {
  users,
  suppliers,
  warehouses,
  categories,
  products,
  inventory,
  movements,
  productDeactivations,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type Warehouse,
  type InsertWarehouse,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Inventory,
  type InsertInventory,
  type Movement,
  type InsertMovement,
} from "@shared/schema";
import { db } from "./db";
import { nanoid } from 'nanoid';
import { eq, and, desc, asc, sql, ilike, lt, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: 'administrator' | 'operator' | 'viewer'): Promise<void>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  
  // Warehouse operations
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: string): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Product operations
  getProducts(limit?: number, offset?: number, search?: string, categoryId?: string, supplierId?: string, lowStockOnly?: boolean): Promise<{ products: Product[]; total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductWithInventory(id: string): Promise<any>;
  getProductMovementSummary(productId: string): Promise<any[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string, opts?: { userId?: string; reason?: string }): Promise<void>;
  reactivateProduct(id: string, opts?: { userId?: string; reason?: string }): Promise<Product>;
  getProductDeactivations(productId: string): Promise<any[]>;
  getProductsBySupplier(supplierId: string): Promise<Product[]>;
  getLowStockProducts(): Promise<any[]>;
  
  // Inventory operations
  getInventoryByWarehouse(warehouseId: string): Promise<any[]>;
  getInventoryByProduct(productId: string): Promise<any[]>;
  getProductStock(productId: string, warehouseId: string): Promise<number>;
  updateInventory(productId: string, warehouseId: string, quantity: number): Promise<void>;
  
  // Movement operations
  getMovements(limit?: number, offset?: number): Promise<{ movements: any[]; total: number }>;
  getMovement(id: string): Promise<Movement | undefined>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  getMovementsByProduct(productId: string): Promise<any[]>;
  getMovementsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalProducts: number;
    lowStockItems: number;
    activeWarehouses: number;
    todayMovements: number;
  }>;
  getRecentMovements(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: 'administrator' | 'operator' | 'viewer'): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true)).orderBy(asc(warehouses.name));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({ ...warehouse, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(limit = 50, offset = 0, search?: string, categoryId?: string, supplierId?: string, lowStockOnly?: boolean): Promise<{ products: Product[]; total: number }> {
    let condition: any = eq(products.isActive, true);
    if (search) {
      condition = and(condition, sql`${products.name} ILIKE ${`%${search}%`} OR ${products.code} ILIKE ${`%${search}%`}`);
    }
    if (categoryId) {
      condition = and(condition, eq(products.categoryId, categoryId));
    }
    if (supplierId) {
      condition = and(condition, eq(products.supplierId, supplierId));
    }
    if (lowStockOnly) {
      // Correlated subquery para comparar stock agregado vs minStock
      condition = and(condition, sql`
        (SELECT COALESCE(SUM(i.current_stock),0) FROM inventory i WHERE i.product_id = ${products.id}) <= COALESCE(${products.minStock},0)
      `);
    }

    const [productsResult, [{ count }]] = await Promise.all([
      db.select().from(products).where(condition)
        .limit(limit).offset(offset).orderBy(asc(products.name)),
      db.select({ count: sql<number>`count(*)` }).from(products).where(condition)
    ]);

    // Agregar stock total y flag de bajo stock (sin romper contrato existente)
    if (productsResult.length) {
      const ids = productsResult.map((p: Product) => p.id);
      // Usar inArray en lugar de ANY para evitar error de tipo cuando se parametriza
      const stockRows = await db
        .select({ productId: inventory.productId, total: sql<number>`SUM(${inventory.currentStock})` })
        .from(inventory)
        .where(inArray(inventory.productId, ids))
        .groupBy(inventory.productId);
      const map: Record<string, number> = {};
      stockRows.forEach((r: { productId: string; total: number }) => { map[r.productId] = Number(r.total) || 0; });
      productsResult.forEach((p: any) => {
        const totalStock = map[p.id] || 0;
        p.totalStock = totalStock;
        if (typeof p.minStock === 'number') {
          p.isLowStock = totalStock <= (p.minStock || 0);
        }
      });
    }

    return { products: productsResult as any, total: count };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductWithInventory(id: string): Promise<any> {
    const result = await db
      .select({
        product: products,
        category: categories,
        supplier: suppliers,
        inventory: inventory,
        warehouse: warehouses,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .where(eq(products.id, id));

    if (result.length === 0) return null;

    const product = result[0].product;
    return {
      ...product,
      category: result[0].category,
      supplier: result[0].supplier,
      inventory: result.map((r: any) => ({
          warehouse: r.warehouse,
          currentStock: r.inventory?.currentStock || 0,
        })).filter((i: any) => i.warehouse),
    };
  }

  async getProductMovementSummary(productId: string): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // incluye hoy
    sevenDaysAgo.setHours(0,0,0,0);
    const rows = await db.execute(sql<any>`
      SELECT date_trunc('day', m.created_at) AS day,
        SUM(CASE WHEN m.type='entry' THEN m.quantity ELSE 0 END) AS entries,
        SUM(CASE WHEN m.type='exit' THEN m.quantity ELSE 0 END) AS exits,
        SUM(CASE WHEN m.type='transfer' THEN m.quantity ELSE 0 END) AS transfers
      FROM movements m
      WHERE m.product_id = ${productId} AND m.created_at >= ${sevenDaysAgo}
      GROUP BY 1
      ORDER BY 1;
    `);
    return (rows as any).rows || [];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [newProduct] = await db.insert(products).values(product).returning();
      return newProduct;
    } catch (e: any) {
      console.error('[storage][createProduct] error code=', e?.code, 'detail=', e?.detail || e?.message);
      throw e;
    }
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string, opts?: { userId?: string; reason?: string }): Promise<void> {
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
    // registrar auditoría con user y reason si vienen
    try {
      await db.insert(productDeactivations).values({ productId: id, action: 'deactivate', userId: opts?.userId ?? null, reason: opts?.reason ?? null }).returning();
    } catch (e) { console.error('[storage] failed to insert product_deactivations', e); }
  }
  
  async reactivateProduct(id: string, opts?: { userId?: string; reason?: string }): Promise<Product> {
    const [p] = await db.update(products).set({ isActive: true, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    try {
      await db.insert(productDeactivations).values({ productId: id, action: 'reactivate', userId: opts?.userId ?? null, reason: opts?.reason ?? null }).returning();
    } catch (e) { console.error('[storage] failed to insert product_deactivations', e); }
    return p;
  }

  async getProductDeactivations(productId: string, limit = 50, offset = 0): Promise<any[]> {
    const rows = await db.select().from(productDeactivations).where(eq(productDeactivations.productId, productId)).orderBy(desc(productDeactivations.createdAt)).limit(limit).offset(offset);
    return rows as any[];
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.supplierId, supplierId), eq(products.isActive, true)));
  }

  async getLowStockProducts(): Promise<any[]> {
    return await db
      .select({
        product: products,
        warehouse: warehouses,
        currentStock: inventory.currentStock,
        minStock: products.minStock,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .where(
        and(
          eq(products.isActive, true),
          sql`${inventory.currentStock} <= ${products.minStock}`
        )
      )
      .orderBy(asc(inventory.currentStock));
  }

  // Inventory operations
  async getInventoryByWarehouse(warehouseId: string): Promise<any[]> {
    return await db
      .select({
        inventory: inventory,
        product: products,
        category: categories,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(inventory.warehouseId, warehouseId))
      .orderBy(asc(products.name));
  }

  async getInventoryByProduct(productId: string): Promise<any[]> {
    return await db
      .select({
        inventory: inventory,
        warehouse: warehouses,
      })
      .from(inventory)
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .where(eq(inventory.productId, productId))
      .orderBy(asc(warehouses.name));
  }

  async getProductStock(productId: string, warehouseId: string): Promise<number> {
    const [result] = await db
      .select({ currentStock: inventory.currentStock })
      .from(inventory)
      .where(and(eq(inventory.productId, productId), eq(inventory.warehouseId, warehouseId)));
    
    return result?.currentStock || 0;
  }

  async updateInventory(productId: string, warehouseId: string, quantity: number): Promise<void> {
    const existing = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.productId, productId), eq(inventory.warehouseId, warehouseId)));

    if (existing.length > 0) {
      await db
        .update(inventory)
        .set({ 
          currentStock: sql`${inventory.currentStock} + ${quantity}`,
          updatedAt: new Date()
        })
        .where(and(eq(inventory.productId, productId), eq(inventory.warehouseId, warehouseId)));
    } else {
      await db.insert(inventory).values({
        productId,
        warehouseId,
        currentStock: Math.max(0, quantity),
      });
    }
  }

  // Movement operations
  async getMovements(limit = 50, offset = 0, opts?: { from?: Date; to?: Date; productId?: string; type?: string; }): Promise<{ movements: any[]; total: number }> {
    const filters: any[] = [];
    if (opts?.from) filters.push(sql`${movements.createdAt} >= ${opts.from}`);
    if (opts?.to) filters.push(sql`${movements.createdAt} <= ${opts.to}`);
    if (opts?.productId) filters.push(eq(movements.productId, opts.productId));
    if (opts?.type) filters.push(eq(movements.type, opts.type as any));
    const whereExpr = filters.length ? and(...filters) : undefined;
    const sourceWarehouses = alias(warehouses, 'sourceWarehouses');
    const destinationWarehouses = alias(warehouses, 'destinationWarehouses');
    const [movementsResult, [{ count }]] = await Promise.all([
      db
        .select({
          movement: movements,
          product: products,
          sourceWarehouse: sourceWarehouses,
          destinationWarehouse: destinationWarehouses,
          user: users,
        })
        .from(movements)
        .innerJoin(products, eq(movements.productId, products.id))
        .leftJoin(sourceWarehouses, eq(movements.sourceWarehouseId, sourceWarehouses.id))
        .leftJoin(destinationWarehouses, eq(movements.destinationWarehouseId, destinationWarehouses.id))
        .innerJoin(users, eq(movements.userId, users.id))
        .where(whereExpr as any)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(movements.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(movements).where(whereExpr as any)
    ]);
    return { movements: movementsResult, total: count };
  }

  async getMovement(id: string): Promise<Movement | undefined> {
    const [movement] = await db.select().from(movements).where(eq(movements.id, id));
    return movement;
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
  return await db.transaction(async (tx: any) => {
      // Create the movement record
      const [newMovement] = await tx.insert(movements).values(movement).returning();

      // Update inventory based on movement type
      if (movement.type === 'entry') {
        if (movement.destinationWarehouseId) {
          await this.updateInventory(movement.productId, movement.destinationWarehouseId, movement.quantity);
        }
      } else if (movement.type === 'exit') {
        if (movement.sourceWarehouseId) {
          await this.updateInventory(movement.productId, movement.sourceWarehouseId, -movement.quantity);
        }
      } else if (movement.type === 'transfer') {
        if (movement.sourceWarehouseId && movement.destinationWarehouseId) {
          await this.updateInventory(movement.productId, movement.sourceWarehouseId, -movement.quantity);
          await this.updateInventory(movement.productId, movement.destinationWarehouseId, movement.quantity);
        }
      }

      return newMovement;
    });
  }

  async getMovementsByProduct(productId: string): Promise<any[]> {
    const sourceWarehouses = alias(warehouses, 'sourceWarehouses');
    const destinationWarehouses = alias(warehouses, 'destinationWarehouses');
    return await db
      .select({
        movement: movements,
        sourceWarehouse: sourceWarehouses,
        destinationWarehouse: destinationWarehouses,
        user: users,
      })
      .from(movements)
      .leftJoin(sourceWarehouses, eq(movements.sourceWarehouseId, sourceWarehouses.id))
      .leftJoin(destinationWarehouses, eq(movements.destinationWarehouseId, destinationWarehouses.id))
      .innerJoin(users, eq(movements.userId, users.id))
      .where(eq(movements.productId, productId))
      .orderBy(desc(movements.createdAt));
  }

  async getMovementsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const sourceWarehouses = alias(warehouses, 'sourceWarehouses');
    const destinationWarehouses = alias(warehouses, 'destinationWarehouses');
    return await db
      .select({
        movement: movements,
        product: products,
        sourceWarehouse: sourceWarehouses,
        destinationWarehouse: destinationWarehouses,
        user: users,
      })
      .from(movements)
      .innerJoin(products, eq(movements.productId, products.id))
      .leftJoin(sourceWarehouses, eq(movements.sourceWarehouseId, sourceWarehouses.id))
      .leftJoin(destinationWarehouses, eq(movements.destinationWarehouseId, destinationWarehouses.id))
      .innerJoin(users, eq(movements.userId, users.id))
      .where(
        and(
          sql`${movements.createdAt} >= ${startDate}`,
          sql`${movements.createdAt} <= ${endDate}`
        )
      )
      .orderBy(desc(movements.createdAt));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalProducts: number;
    lowStockItems: number;
    activeWarehouses: number;
    todayMovements: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      [{ totalProducts }],
      [{ lowStockItems }],
      [{ activeWarehouses }],
      [{ todayMovements }]
    ] = await Promise.all([
      db.select({ totalProducts: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
      db.select({ lowStockItems: sql<number>`count(*)` })
        .from(inventory)
        .innerJoin(products, eq(inventory.productId, products.id))
        .where(and(eq(products.isActive, true), sql`${inventory.currentStock} <= ${products.minStock}`)),
      db.select({ activeWarehouses: sql<number>`count(*)` }).from(warehouses).where(eq(warehouses.isActive, true)),
      db.select({ todayMovements: sql<number>`count(*)` })
        .from(movements)
        .where(and(sql`${movements.createdAt} >= ${today}`, sql`${movements.createdAt} < ${tomorrow}`))
    ]);

    return {
      totalProducts,
      lowStockItems,
      activeWarehouses,
      todayMovements,
    };
  }

  async getRecentMovements(limit = 10): Promise<any[]> {
    const sourceWarehouses = alias(warehouses, 'sourceWarehouses');
    const destinationWarehouses = alias(warehouses, 'destinationWarehouses');
    
    return await db
      .select({
        movement: movements,
        product: products,
        sourceWarehouse: sourceWarehouses,
        destinationWarehouse: destinationWarehouses,
        user: users,
      })
      .from(movements)
      .innerJoin(products, eq(movements.productId, products.id))
      .leftJoin(sourceWarehouses, eq(movements.sourceWarehouseId, sourceWarehouses.id))
      .leftJoin(destinationWarehouses, eq(movements.destinationWarehouseId, destinationWarehouses.id))
      .innerJoin(users, eq(movements.userId, users.id))
      .limit(limit)
      .orderBy(desc(movements.createdAt));
  }

  async getTodayMovementTypeCounts(): Promise<{ entry: number; exit: number; transfer: number; adjustment: number; total: number }> {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const rows = await db
      .select({ type: movements.type, count: sql<number>`count(*)` })
      .from(movements)
      .where(and(sql`${movements.createdAt} >= ${today}`, sql`${movements.createdAt} < ${tomorrow}`))
      .groupBy(movements.type);
    const result: any = { entry: 0, exit: 0, transfer: 0, adjustment: 0 };
  rows.forEach((r: { type: string; count: number }) => { result[r.type as keyof typeof result] = Number(r.count) || 0; });
    result.total = result.entry + result.exit + result.transfer + result.adjustment;
    return result;
  }
}

class InMemoryStorage implements IStorage {
  users = new Map<string, any>();
  suppliers = new Map<string, any>();
  warehouses = new Map<string, any>();
  categories = new Map<string, any>();
  products = new Map<string, any>();
  productDeactivations = new Map<string, any[]>();
  inventory = new Map<string, any>(); // key: `${productId}|${warehouseId}`
  movements = new Map<string, any>();

  // User operations
  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByEmail(email: string) {
    for (const u of Array.from(this.users.values())) {
      if (u.email === email) return u;
    }
    return undefined;
  }

  async getUserByUsername(username: string) {
    for (const u of Array.from(this.users.values())) {
      if (u.username === username) return u;
    }
    return undefined;
  }

  async upsertUser(userData: any) {
    const id = (userData as any).id || nanoid();
    const now = new Date();
    const existing = this.users.get(id) || {};
    const user = {
      id,
      ...existing,
      ...userData,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRole(id: string, role: 'administrator' | 'operator' | 'viewer') {
    const user = this.users.get(id);
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  // Suppliers
  async getSuppliers() {
    return Array.from(this.suppliers.values()).filter((s: any) => s.isActive !== false).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }

  async getSupplier(id: string) {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: any) {
    const id = nanoid();
    const now = new Date();
    const s = { id, ...supplier, isActive: supplier.isActive !== false, createdAt: now, updatedAt: now };
    this.suppliers.set(id, s);
    return s;
  }

  async updateSupplier(id: string, supplier: Partial<any>) {
    const existing = this.suppliers.get(id) || {};
    const updated = { ...existing, ...supplier, updatedAt: new Date() };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string) {
    const s = this.suppliers.get(id);
    if (s) {
      s.isActive = false;
      s.updatedAt = new Date();
      this.suppliers.set(id, s);
    }
  }

  // Warehouses
  async getWarehouses() {
    return Array.from(this.warehouses.values()).filter((w: any) => w.isActive !== false).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }

  async getWarehouse(id: string) {
    return this.warehouses.get(id);
  }

  async createWarehouse(warehouse: any) {
    const id = nanoid();
    const now = new Date();
    const w = { id, ...warehouse, isActive: warehouse.isActive !== false, createdAt: now, updatedAt: now };
    this.warehouses.set(id, w);
    return w;
  }

  async updateWarehouse(id: string, warehouse: Partial<any>) {
    const existing = this.warehouses.get(id) || {};
    const updated = { ...existing, ...warehouse, updatedAt: new Date() };
    this.warehouses.set(id, updated);
    return updated;
  }

  async deleteWarehouse(id: string) {
    const w = this.warehouses.get(id);
    if (w) {
      w.isActive = false;
      w.updatedAt = new Date();
      this.warehouses.set(id, w);
    }
  }

  // Categories
  async getCategories() {
    return Array.from(this.categories.values()).filter((c: any) => c.isActive !== false).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }

  async getCategory(id: string) {
    return this.categories.get(id);
  }

  async createCategory(category: any) {
    const id = nanoid();
    const now = new Date();
    const c = { id, ...category, isActive: category.isActive !== false, createdAt: now, updatedAt: now };
    this.categories.set(id, c);
    return c;
  }

  async updateCategory(id: string, category: Partial<any>) {
    const existing = this.categories.get(id) || {};
    const updated = { ...existing, ...category, updatedAt: new Date() };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string) {
    const c = this.categories.get(id);
    if (c) {
      c.isActive = false;
      c.updatedAt = new Date();
      this.categories.set(id, c);
    }
  }

  // Products
  async getProducts(limit = 50, offset = 0, search?: string, categoryId?: string, supplierId?: string, lowStockOnly?: boolean) {
    let list = Array.from(this.products.values()).filter((p: any) => p.isActive !== false);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q));
    }
    if (categoryId) list = list.filter((p: any) => p.categoryId === categoryId);
    if (supplierId) list = list.filter((p: any) => p.supplierId === supplierId);
    if (lowStockOnly) {
      list = list.filter((p: any) => {
        const sum = Array.from(this.inventory.values()).filter((i: any) => i.productId === p.id).reduce((acc: number, r: any) => acc + (r.currentStock || 0), 0);
        return sum <= (p.minStock || 0);
      });
    }
    const total = list.length;
    const products = list.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')).slice(offset, offset + limit);
    return { products, total };
  }

  async getProductMovementSummary(productId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    const byDay: Record<string, any> = {};
    for (const m of Array.from(this.movements.values())) {
      if (m.productId !== productId) continue;
      const d = new Date(m.createdAt);
      if (d < sevenDaysAgo) continue;
      const key = d.toISOString().substring(0,10);
      if (!byDay[key]) byDay[key] = { day: key, entries: 0, exits: 0, transfers: 0 };
      if (m.type === 'entry') byDay[key].entries += m.quantity;
      else if (m.type === 'exit') byDay[key].exits += m.quantity;
      else if (m.type === 'transfer') byDay[key].transfers += m.quantity;
    }
    return Object.values(byDay).sort((a: any, b: any) => a.day.localeCompare(b.day));
  }

  async getProduct(id: string) {
    return this.products.get(id);
  }

  async getProductWithInventory(id: string) {
    const product = this.products.get(id);
    if (!product) return null;
    const inventoryList = Array.from(this.inventory.values()).filter((i: any) => i.productId === id).map((i: any) => ({ warehouse: this.warehouses.get(i.warehouseId), currentStock: i.currentStock || 0 }));
    return { ...product, category: this.categories.get(product.categoryId), supplier: this.suppliers.get(product.supplierId), inventory: inventoryList.filter((i: any) => i.warehouse) };
  }

  async createProduct(product: any) {
    // Simular constraint UNIQUE en code si existe campo code
    if (product?.code) {
      const existingList = Array.from(this.products.values());
      for (let i = 0; i < existingList.length; i++) {
        const existing = existingList[i];
        if (existing.code && existing.code === product.code) {
          const err: any = new Error('duplicate product code');
          err.code = '23505';
          throw err;
        }
      }
    }
    const id = nanoid();
    const now = new Date();
    const p = { id, ...product, isActive: product.isActive !== false, createdAt: now, updatedAt: now };
    this.products.set(id, p);
    return p;
  }

  async updateProduct(id: string, product: Partial<any>) {
    const existing = this.products.get(id) || {};
    const updated = { ...existing, ...product, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string, opts?: { userId?: string; reason?: string }) {
    const p = this.products.get(id);
    if (p) {
      p.isActive = false;
      p.updatedAt = new Date();
      if (opts?.userId) p.deactivatedBy = opts.userId;
      if (opts?.reason) p.deactivationReason = opts.reason;
      p.deactivatedAt = new Date();
      this.products.set(id, p);
  // store audit event
  const ev = { id: nanoid(), productId: id, userId: opts?.userId ?? null, action: 'deactivate', reason: opts?.reason ?? null, createdAt: new Date() };
  const arr = this.productDeactivations.get(id) || [];
  arr.unshift(ev);
  this.productDeactivations.set(id, arr);
    }
  }

  async reactivateProduct(id: string, opts?: { userId?: string; reason?: string }) {
    const p = this.products.get(id);
    if (!p) throw new Error('not found');
    p.isActive = true;
    p.updatedAt = new Date();
    if (opts?.userId) p.reactivatedBy = opts.userId;
    if (opts?.reason) p.reactivationReason = opts.reason;
    p.reactivatedAt = new Date();
    this.products.set(id, p);
  const ev = { id: nanoid(), productId: id, userId: opts?.userId ?? null, action: 'reactivate', reason: opts?.reason ?? null, createdAt: new Date() };
  const arr = this.productDeactivations.get(id) || [];
  arr.unshift(ev);
  this.productDeactivations.set(id, arr);
    return p;
  }

  async getProductDeactivations(productId: string, limit = 50, offset = 0) {
    const arr = this.productDeactivations.get(productId) || [];
    return arr.slice(offset, offset + limit);
  }

  async getProductsBySupplier(supplierId: string) {
    return Array.from(this.products.values()).filter((p: any) => p.supplierId === supplierId && p.isActive !== false);
  }

  async getLowStockProducts() {
    return Array.from(this.inventory.values()).map((i: any) => {
      const product = this.products.get(i.productId);
      const warehouse = this.warehouses.get(i.warehouseId);
      return { product, warehouse, currentStock: i.currentStock || 0, minStock: product?.minStock || 0 };
    }).filter((r: any) => r.product && r.currentStock <= (r.minStock || 0)).sort((a: any, b: any) => (a.currentStock - b.currentStock));
  }

  // Inventory
  async getInventoryByWarehouse(warehouseId: string) {
    return Array.from(this.inventory.values()).filter((i: any) => i.warehouseId === warehouseId).map((i: any) => ({ inventory: i, product: this.products.get(i.productId), category: this.categories.get(this.products.get(i.productId)?.categoryId) }));
  }

  async getInventoryByProduct(productId: string) {
    return Array.from(this.inventory.values()).filter((i: any) => i.productId === productId).map((i: any) => ({ inventory: i, warehouse: this.warehouses.get(i.warehouseId) }));
  }

  async getProductStock(productId: string, warehouseId: string) {
    const key = `${productId}|${warehouseId}`;
    const inv = this.inventory.get(key);
    return inv?.currentStock || 0;
  }

  async updateInventory(productId: string, warehouseId: string, quantity: number) {
    const key = `${productId}|${warehouseId}`;
    const existing = this.inventory.get(key);
    if (existing) {
      existing.currentStock = Math.max(0, (existing.currentStock || 0) + quantity);
      existing.updatedAt = new Date();
      this.inventory.set(key, existing);
    } else {
      const inv = { id: nanoid(), productId, warehouseId, currentStock: Math.max(0, quantity), updatedAt: new Date() };
      this.inventory.set(key, inv);
    }
  }

  // Movements
  async getMovements(limit = 50, offset = 0) {
    const list = Array.from(this.movements.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = list.length;
    const movements = list.slice(offset, offset + limit).map((m: any) => ({ movement: m, product: this.products.get(m.productId), sourceWarehouse: this.warehouses.get(m.sourceWarehouseId), destinationWarehouse: this.warehouses.get(m.destinationWarehouseId), user: this.users.get(m.userId) }));
    return { movements, total };
  }

  async getMovement(id: string) {
    return this.movements.get(id);
  }

  async createMovement(movement: any) {
    const id = nanoid();
    const now = new Date();
    const m = { id, ...movement, createdAt: now };
    this.movements.set(id, m);

    // Update inventory depending on type
    if (m.type === 'entry') {
      if (m.destinationWarehouseId) await this.updateInventory(m.productId, m.destinationWarehouseId, m.quantity);
    } else if (m.type === 'exit') {
      if (m.sourceWarehouseId) await this.updateInventory(m.productId, m.sourceWarehouseId, -m.quantity);
    } else if (m.type === 'transfer') {
      if (m.sourceWarehouseId && m.destinationWarehouseId) {
        await this.updateInventory(m.productId, m.sourceWarehouseId, -m.quantity);
        await this.updateInventory(m.productId, m.destinationWarehouseId, m.quantity);
      }
    }

    return m;
  }

  async getMovementsByProduct(productId: string) {
    return Array.from(this.movements.values()).filter((m: any) => m.productId === productId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((m: any) => ({ movement: m, sourceWarehouse: this.warehouses.get(m.sourceWarehouseId), destinationWarehouse: this.warehouses.get(m.destinationWarehouseId), user: this.users.get(m.userId) }));
  }

  async getMovementsByDateRange(startDate: Date, endDate: Date) {
    return Array.from(this.movements.values()).filter((m: any) => {
      const d = new Date(m.createdAt);
      return d >= startDate && d <= endDate;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((m: any) => ({ movement: m, product: this.products.get(m.productId), sourceWarehouse: this.warehouses.get(m.sourceWarehouseId), destinationWarehouse: this.warehouses.get(m.destinationWarehouseId), user: this.users.get(m.userId) }));
  }

  // Dashboard
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalProducts = Array.from(this.products.values()).filter((p: any) => p.isActive !== false).length;
    const lowStockItems = Array.from(this.inventory.values()).filter((i: any) => {
      const product = this.products.get(i.productId);
      return product && (i.currentStock || 0) <= (product.minStock || 0);
    }).length;
    const activeWarehouses = Array.from(this.warehouses.values()).filter((w: any) => w.isActive !== false).length;
    const todayMovements = Array.from(this.movements.values()).filter((m: any) => {
      const d = new Date(m.createdAt);
      return d >= today && d < tomorrow;
    }).length;

    return { totalProducts, lowStockItems, activeWarehouses, todayMovements };
  }

  async getRecentMovements(limit = 10) {
    return Array.from(this.movements.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit).map((m: any) => ({ movement: m, product: this.products.get(m.productId), sourceWarehouse: this.warehouses.get(m.sourceWarehouseId), destinationWarehouse: this.warehouses.get(m.destinationWarehouseId), user: this.users.get(m.userId) }));
  }

  async getTodayMovementTypeCounts() {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const result = { entry: 0, exit: 0, transfer: 0, adjustment: 0, total: 0 };
    for (const m of Array.from(this.movements.values())) {
      const d = new Date(m.createdAt);
      if (d >= today && d < tomorrow) {
        if (result[m.type as keyof typeof result] !== undefined) {
          (result as any)[m.type]++;
          result.total++;
        }
      }
    }
    return result;
  }
}

export { InMemoryStorage };

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new InMemoryStorage();
