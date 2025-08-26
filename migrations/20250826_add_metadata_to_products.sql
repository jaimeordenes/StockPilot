-- Add metadata jsonb column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata jsonb;
