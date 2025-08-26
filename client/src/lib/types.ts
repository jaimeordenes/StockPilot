// Re-export types from shared schema for easier frontend imports
export type {
  User,
  UpsertUser,
  Supplier,
  InsertSupplier,
  Warehouse,
  InsertWarehouse,
  Category,
  InsertCategory,
  Product,
  InsertProduct,
  Inventory,
  InsertInventory,
  Movement,
  InsertMovement,
} from "@shared/schema";

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  activeWarehouses: number;
  todayMovements: number;
}

export interface LowStockProduct {
  product: {
    id: string;
    name: string;
    code: string;
    minStock: number;
  };
  warehouse: {
    id: string;
    name: string;
  };
  currentStock: number;
  minStock: number;
}

export interface RecentMovement {
  movement: {
    id: string;
    type: 'entry' | 'exit' | 'transfer' | 'adjustment';
    quantity: number;
    createdAt: string;
  };
  product: {
    id: string;
    name: string;
  };
  sourceWarehouse?: {
    id: string;
    name: string;
  };
  destinationWarehouse?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProductWithInventory {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  inventory: Array<{
    warehouse: {
      id: string;
      name: string;
    };
    currentStock: number;
  }>;
  minStock?: number;
  maxStock?: number;
  unit: string;
  purchasePrice?: string;
  salePrice?: string;
}

export interface MovementFormData {
  productId: string;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  unitPrice?: number;
  reason?: string;
}

export interface ProductFormData {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  unit: string;
  purchasePrice?: number;
  salePrice?: number;
  minStock?: number;
  maxStock?: number;
  supplierId?: string;
  barcode?: string;
}

export interface WarehouseFormData {
  name: string;
  location?: string;
  capacity?: number;
  managerId?: string;
}

export interface SupplierFormData {
  name: string;
  taxId?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
}