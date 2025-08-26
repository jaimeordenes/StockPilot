-- Migration: add attachment_url column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS attachment_url varchar(1024);

-- Optional: create index if you plan to query by attachment_url
-- CREATE INDEX IF NOT EXISTS idx_products_attachment_url ON products (attachment_url);
