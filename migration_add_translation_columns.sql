-- Execute this script in your Supabase SQL Editor to add the translation columns

ALTER TABLE services
ADD COLUMN IF NOT EXISTS name_pt text,
ADD COLUMN IF NOT EXISTS description_pt text,
ADD COLUMN IF NOT EXISTS name_de text,
ADD COLUMN IF NOT EXISTS description_de text;

-- Optional: Add comments to help identify the columns
COMMENT ON COLUMN services.name_pt IS 'Portuguese translation of the service name';
COMMENT ON COLUMN services.description_pt IS 'Portuguese translation of the service description';
COMMENT ON COLUMN services.name_de IS 'German translation of the service name (explicit)';
COMMENT ON COLUMN services.description_de IS 'German translation of the service description (explicit)';
