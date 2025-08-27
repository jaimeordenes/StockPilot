import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSupplierSchema,
  insertWarehouseSchema,
  insertCategorySchema,
  insertProductSchema,
  insertMovementSchema,
} from "@shared/schema";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Basic health endpoint (no auth) for readiness checks
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // Helper to extract user id from different session shapes
  function extractUserId(req: any): string | undefined {
    if (!req.user) return undefined;
    // OIDC-style
    if (req.user.claims && req.user.claims.sub) return req.user.claims.sub;
    // local session created via req.login({ id, ... })
    if (req.user.id) return req.user.id;
    // fallback: maybe stored directly as sub
    if (req.user.sub) return req.user.sub;
    return undefined;
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = extractUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/low-stock', isAuthenticated, async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get('/api/dashboard/recent-movements', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentMovements = await storage.getRecentMovements(limit);
      res.json(recentMovements);
    } catch (error) {
      console.error("Error fetching recent movements:", error);
      res.status(500).json({ message: "Failed to fetch recent movements" });
    }
  });

  app.get('/api/dashboard/movements-today', isAuthenticated, async (_req, res) => {
    try {
      const counts = await storage.getTodayMovementTypeCounts();
      res.json(counts);
    } catch (e: any) {
      console.error('Error movements-today', e);
      res.status(500).json({ error: 'Error obteniendo conteos de movimientos de hoy' });
    }
  });

  // Export endpoints (CSV)
  function sendCsv(res: any, filename: string, headers: string[], rows: any[]) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      if (/[",\n;]/.test(s)) return '"' + s + '"';
      return s;
    };
  const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push(headers.map(h => escape((r as any)[h])).join(','));
    }
  // Añadimos BOM UTF-8 para compatibilidad con Excel
  res.send('\ufeff' + lines.join('\n'));
  }

  app.get('/api/export/products', isAuthenticated, async (req, res) => {
    try {
      const limit = 10_000; // hard cap
      const { search, categoryId, supplierId, lowStockOnly } = req.query as any;
      const result = await storage.getProducts(limit, 0, search, categoryId, supplierId, lowStockOnly === 'true');
      const headers = ['id','code','name','brand','unit','minStock','maxStock','purchasePrice','salePrice','totalStock','isLowStock'];
      const rows = (result.products as any).map((p: any) => ({
        id: p.id, code: p.code, name: p.name, brand: p.brand, unit: p.unit, minStock: p.minStock, maxStock: p.maxStock,
        purchasePrice: p.purchasePrice, salePrice: p.salePrice, totalStock: p.totalStock, isLowStock: p.isLowStock
      }));
      sendCsv(res, 'productos.csv', headers, rows);
    } catch (error) {
      console.error('Error export products:', error);
      res.status(500).json({ message: 'Failed to export products' });
    }
  });

  app.get('/api/export/inventory', isAuthenticated, async (_req, res) => {
    try {
      const low = await storage.getLowStockProducts();
      const headers = ['productCode','productName','warehouseName','currentStock','minStock'];
      const rows = low.map((r: any) => ({
        productCode: r.product.code,
        productName: r.product.name,
        warehouseName: r.warehouse.name,
        currentStock: r.currentStock,
        minStock: r.minStock
      }));
      sendCsv(res, 'inventario_bajo_stock.csv', headers, rows);
    } catch (error) {
      console.error('Error export inventory:', error);
      res.status(500).json({ message: 'Failed to export inventory' });
    }
  });

  app.get('/api/export/movements', isAuthenticated, async (req, res) => {
    try {
      const limit = 50_000;
      const { from, to, productId, type } = req.query as any;
      const opts: any = {};
      if (from) opts.from = new Date(from);
      if (to) opts.to = new Date(to);
      if (productId) opts.productId = productId;
      if (type) opts.type = type;
      const result = await storage.getMovements(limit, 0, opts);
      const headers = ['id','productCode','productName','type','quantity','sourceWarehouse','destinationWarehouse','user','createdAt'];
      const rows = result.movements.map((m: any) => ({
        id: m.movement.id,
        productCode: m.product.code,
        productName: m.product.name,
        type: m.movement.type,
        quantity: m.movement.quantity,
        sourceWarehouse: m.sourceWarehouse?.name || '',
        destinationWarehouse: m.destinationWarehouse?.name || '',
        user: (m.user?.firstName || '') + ' ' + (m.user?.lastName || ''),
        createdAt: m.movement.createdAt.toISOString()
      }));
      sendCsv(res, 'movimientos.csv', headers, rows);
    } catch (error) {
      console.error('Error export movements:', error);
      res.status(500).json({ message: 'Failed to export movements' });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier || supplier.isActive === false) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has permission to create suppliers
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || user.role !== 'administrator') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.get('/api/warehouses/:id', isAuthenticated, async (req, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse || warehouse.isActive === false) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  app.post('/api/warehouses', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(validatedData);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.put('/api/warehouses/:id', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(req.params.id, validatedData);
      res.json(warehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete('/api/warehouses/:id', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || user.role !== 'administrator') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteWarehouse(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
  const userId = extractUserId(req);
  const user = userId ? await storage.getUser(userId) : undefined;
  if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const supplierId = req.query.supplierId as string;
      const lowStockOnly = req.query.lowStockOnly === 'true';
      
      const result = await storage.getProducts(limit, offset, search, categoryId, supplierId, lowStockOnly);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProductWithInventory(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/products/:id/movement-summary', isAuthenticated, async (req, res) => {
    try {
      const summary = await storage.getProductMovementSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching product movement summary:', error);
      res.status(500).json({ message: 'Failed to fetch product movement summary' });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = extractUserId(req);
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
  // Separate known columns vs extended fields → put extras into metadata json
  const { code, name, description, categoryId, brand, unit, purchasePrice, salePrice, minStock, maxStock, supplierId, barcode, attachmentUrl, ...rest } = req.body || {};
  const payloadRaw: any = { code, name, description, categoryId, brand, unit, purchasePrice, salePrice, minStock, maxStock, supplierId, barcode, attachmentUrl, metadata: Object.keys(rest).length ? rest : undefined };
  // Normalizar decimales/números a string para columnas decimal en schema zod
  for (const k of ['purchasePrice','salePrice']) if (payloadRaw[k] !== undefined && payloadRaw[k] !== null) payloadRaw[k] = String(payloadRaw[k]);
  const payload = payloadRaw;
  console.log('[products:create] incoming', JSON.stringify(payload));
  const validatedData = insertProductSchema.parse(payload);
      console.log('[products:create] validated', validatedData.code);
      const product = await storage.createProduct(validatedData);
      console.log('[products:create] created id=', product.id);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error?.code === '23505') {
        return res.status(409).json({ message: 'Product code already exists' });
      }
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid product data', issues: error.issues });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = extractUserId(req);
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
  const { code, name, description, categoryId, brand, unit, purchasePrice, salePrice, minStock, maxStock, supplierId, barcode, attachmentUrl, ...rest } = req.body || {};
  const payload: any = { code, name, description, categoryId, brand, unit, purchasePrice, salePrice, minStock, maxStock, supplierId, barcode, attachmentUrl };
  for (const k of ['purchasePrice','salePrice']) if (payload[k] !== undefined && payload[k] !== null) payload[k] = String(payload[k]);
  if (Object.keys(rest).length) payload.metadata = rest;
  console.log('[products:update] id=', req.params.id, 'incoming', JSON.stringify(payload));
  const validatedData = insertProductSchema.partial().parse(payload);
      const product = await storage.updateProduct(req.params.id, validatedData);
      console.log('[products:update] updated id=', product.id);
      res.json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      if (error?.code === '23505') {
        return res.status(409).json({ message: 'Product code already exists' });
      }
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid product data', issues: error.issues });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = extractUserId(req);
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user || !user.role || user.role !== 'administrator') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const reason = req.body?.reason || req.query?.reason;
      await storage.deleteProduct(req.params.id, { userId, reason });
      console.log('[products:delete] id=', req.params.id, 'by=', userId, 'reason=', reason);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Reactivate a product
  app.post('/api/products/:id/reactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = extractUserId(req);
      const user = userId ? await storage.getUser(userId) : undefined;
      if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const reason = req.body?.reason || req.query?.reason;
      const product = await storage.reactivateProduct(req.params.id, { userId, reason });
      console.log('[products:reactivate] id=', req.params.id, 'by=', userId, 'reason=', reason);
      res.json(product);
    } catch (error: any) {
      console.error('Error reactivating product:', error);
      res.status(500).json({ message: 'Failed to reactivate product' });
    }
  });

  // Get audit events for a product (deactivate/reactivate)
  app.get('/api/products/:id/audit', isAuthenticated, async (req: any, res) => {
    try {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  // Log access for audit endpoint: timestamp, product, user, pagination and remote info
  const callerUserId = extractUserId(req) || null;
  const remoteIp = (req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '').toString();
  console.log(`[audit] ${new Date().toISOString()} productId=${req.params.id} userId=${callerUserId} ip=${remoteIp} limit=${limit} offset=${offset} ua=${req.get('user-agent') || ''}`);
  const events = await storage.getProductDeactivations(req.params.id, limit, offset);
  res.json({ events, limit, offset });
    } catch (e) {
      console.error('Error fetching product audit', e);
      res.status(500).json({ message: 'Failed to fetch product audit' });
    }
  });

  // Internal lightweight user lookup for UI (returns minimal profile)
  app.get('/api/internal/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const u = await storage.getUser(req.params.id);
      if (!u) return res.status(404).json({ message: 'User not found' });
      res.json({ id: u.id, username: u.username, firstName: (u as any).firstName || (u as any).first_name, lastName: (u as any).lastName || (u as any).last_name });
    } catch (e) {
      console.error('Error fetching internal user', e);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Movement routes
  app.get('/api/movements', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getMovements(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching movements:", error);
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  app.get('/api/movements/product/:productId', isAuthenticated, async (req, res) => {
    try {
      const movements = await storage.getMovementsByProduct(req.params.productId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching product movements:", error);
      res.status(500).json({ message: "Failed to fetch product movements" });
    }
  });

  app.post('/api/movements', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !user.role || !['administrator', 'operator'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = extractUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const validatedData = insertMovementSchema.parse({
        ...req.body,
        userId,
      });
      
      const movement = await storage.createMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating movement:", error);
      res.status(500).json({ message: "Failed to create movement" });
    }
  });

  // Inventory routes
  app.get('/api/inventory/warehouse/:warehouseId', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByWarehouse(req.params.warehouseId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error);
      res.status(500).json({ message: "Failed to fetch warehouse inventory" });
    }
  });

  app.get('/api/inventory/product/:productId', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByProduct(req.params.productId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching product inventory:", error);
      res.status(500).json({ message: "Failed to fetch product inventory" });
    }
  });

  // Inventory overview endpoint (returns product + warehouse + quantity)
  // Public inventory endpoint (read-only)
  app.get('/api/inventory', async (req, res) => {
    try {
      if (!pool) return res.status(500).json({ message: 'DB not configured' });
      const client = await pool.connect();
      try {
        // Try Spanish schema first
        const spanishCheck = await client.query("SELECT to_regclass('public.inventario') IS NOT NULL as exists");
        if (spanishCheck.rows[0].exists) {
          const q = `SELECT p.codigo as product_code, p.nombre as product_name, b.nombre as warehouse_name, i.cantidad_actual as quantity
            FROM inventario i
            JOIN productos p ON p.id = i.producto_id
            JOIN bodegas b ON b.id = i.bodega_id
            ORDER BY p.codigo`;
          const r = await client.query(q);
          return res.json(r.rows);
        }

        // Fallback to English schema
        const engCheck = await client.query("SELECT to_regclass('public.inventory') IS NOT NULL as exists");
        if (engCheck.rows[0].exists) {
          const q = `SELECT p.code as product_code, p.name as product_name, w.name as warehouse_name, i.current_stock as quantity
            FROM inventory i
            JOIN products p ON p.id = i.product_id
            JOIN warehouses w ON w.id = i.warehouse_id
            ORDER BY p.code`;
          const r = await client.query(q);
          return res.json(r.rows);
        }

        // As last resort, return movements as fallback
        const movements = await storage.getRecentMovements(100);
        return res.json(movements);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Failed to fetch inventory' });
    }
  });

  // Upload endpoint for product attachments
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const storageMulter = multer({ dest: uploadsDir });

  app.post('/api/uploads', isAuthenticated, storageMulter.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const filename = req.file.filename; // multer assigned filename
      const url = `/uploads/${filename}`;
      res.status(201).json({ url, filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Spanish alias
  app.get('/api/inventario', isAuthenticated, async (req, res) => {
    return app._router.handle(req, res, () => {}, '/api/inventory');
  });

  app.get('/api/inventario/producto/:productId', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByProduct(req.params.productId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventario producto:', error);
      res.status(500).json({ message: 'Failed to fetch inventario producto' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
