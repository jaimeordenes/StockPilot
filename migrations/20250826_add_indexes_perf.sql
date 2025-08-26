-- Índices para mejorar consultas de movimientos y productos
CREATE INDEX IF NOT EXISTS idx_movements_product_created ON movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type_created ON movements(type, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
-- Fin