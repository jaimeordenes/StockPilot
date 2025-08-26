import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['administrator', 'operator', 'viewer']);
export const movementTypeEnum = pgEnum('movement_type', ['entry', 'exit', 'transfer', 'adjustment']);

// Users table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('viewer'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  taxId: varchar("tax_id", { length: 50 }),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouses table
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity"),
  managerId: varchar("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  brand: varchar("brand", { length: 255 }),
  unit: varchar("unit", { length: 50 }).notNull().default('unit'),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  barcode: varchar("barcode", { length: 255 }),
  // URL to an uploaded attachment (invoice copy, image, etc.)
  attachmentUrl: varchar("attachment_url", { length: 1024 }),
  // Arbitrary extended product metadata (family, subfamily, group, presentation, batch, etc.)
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table (tracks current stock per warehouse)
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  currentStock: integer("current_stock").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_inventory_product_warehouse").on(table.productId, table.warehouseId),
]);

// Movements table (tracks all inventory movements)
export const movements = pgTable("movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  sourceWarehouseId: varchar("source_warehouse_id").references(() => warehouses.id),
  destinationWarehouseId: varchar("destination_warehouse_id").references(() => warehouses.id),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }),
  reason: text("reason"),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_movements_product").on(table.productId),
  index("idx_movements_date").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedWarehouses: many(warehouses),
  movements: many(movements),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  manager: one(users, {
    fields: [warehouses.managerId],
    references: [users.id],
  }),
  inventory: many(inventory),
  sourceMovements: many(movements, {
    relationName: "sourceWarehouse",
  }),
  destinationMovements: many(movements, {
    relationName: "destinationWarehouse",
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  inventory: many(inventory),
  movements: many(movements),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventory.warehouseId],
    references: [warehouses.id],
  }),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  product: one(products, {
    fields: [movements.productId],
    references: [products.id],
  }),
  sourceWarehouse: one(warehouses, {
    fields: [movements.sourceWarehouseId],
    references: [warehouses.id],
    relationName: "sourceWarehouse",
  }),
  destinationWarehouse: one(warehouses, {
    fields: [movements.destinationWarehouseId],
    references: [warehouses.id],
    relationName: "destinationWarehouse",
  }),
  user: one(users, {
    fields: [movements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
export const insertMovementSchema = createInsertSchema(movements).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type Movement = typeof movements.$inferSelect;
