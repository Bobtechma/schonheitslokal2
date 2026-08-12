-- Add image_url column to services table to support product/service images
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
