import {
  users,
  suppliers,
  warehouses,
  categories,
  products,
  inventory,
  movements,
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
import { eq, and, desc, asc, sql, ilike, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
  getProducts(limit?: number, offset?: number, search?: string): Promise<{ products: Product[]; total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductWithInventory(id: string): Promise<any>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
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
  async getProducts(limit = 50, offset = 0, search?: string): Promise<{ products: Product[]; total: number }> {
    const baseCondition = eq(products.isActive, true);
    const searchCondition = search 
      ? sql`${products.name} ILIKE ${`%${search}%`} OR ${products.code} ILIKE ${`%${search}%`}`
      : sql`true`;
    
    const finalCondition = search ? and(baseCondition, searchCondition) : baseCondition;
    
    const [productsResult, [{ count }]] = await Promise.all([
      db.select().from(products).where(finalCondition)
        .limit(limit).offset(offset).orderBy(asc(products.name)),
      db.select({ count: sql<number>`count(*)` }).from(products).where(finalCondition)
    ]);

    return { products: productsResult, total: count };
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
      inventory: result.map(r => ({
        warehouse: r.warehouse,
        currentStock: r.inventory?.currentStock || 0,
      })).filter(i => i.warehouse),
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
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
  async getMovements(limit = 50, offset = 0): Promise<{ movements: any[]; total: number }> {
    const [movementsResult, [{ count }]] = await Promise.all([
      db
        .select({
          movement: movements,
          product: products,
          sourceWarehouse: warehouses,
          destinationWarehouse: warehouses,
          user: users,
        })
        .from(movements)
        .innerJoin(products, eq(movements.productId, products.id))
        .leftJoin(warehouses, eq(movements.sourceWarehouseId, warehouses.id))
        .leftJoin(warehouses, eq(movements.destinationWarehouseId, warehouses.id))
        .innerJoin(users, eq(movements.userId, users.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(movements.createdAt)),
      
      db.select({ count: sql<number>`count(*)` }).from(movements)
    ]);

    return { movements: movementsResult, total: count };
  }

  async getMovement(id: string): Promise<Movement | undefined> {
    const [movement] = await db.select().from(movements).where(eq(movements.id, id));
    return movement;
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    return await db.transaction(async (tx) => {
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
    return await db
      .select({
        movement: movements,
        sourceWarehouse: warehouses,
        destinationWarehouse: warehouses,
        user: users,
      })
      .from(movements)
      .leftJoin(warehouses, eq(movements.sourceWarehouseId, warehouses.id))
      .leftJoin(warehouses, eq(movements.destinationWarehouseId, warehouses.id))
      .innerJoin(users, eq(movements.userId, users.id))
      .where(eq(movements.productId, productId))
      .orderBy(desc(movements.createdAt));
  }

  async getMovementsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select({
        movement: movements,
        product: products,
        sourceWarehouse: warehouses,
        destinationWarehouse: warehouses,
        user: users,
      })
      .from(movements)
      .innerJoin(products, eq(movements.productId, products.id))
      .leftJoin(warehouses, eq(movements.sourceWarehouseId, warehouses.id))
      .leftJoin(warehouses, eq(movements.destinationWarehouseId, warehouses.id))
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
}

export const storage = new DatabaseStorage();
