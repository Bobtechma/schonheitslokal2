-- Add subcategory column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS subcategory text DEFAULT 'Gerill';
