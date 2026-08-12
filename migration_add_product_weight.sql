-- Add weight column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0;
