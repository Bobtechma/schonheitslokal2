-- Create carousel_items table for homepage product carousel
CREATE TABLE IF NOT EXISTS carousel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ordering
CREATE INDEX IF NOT EXISTS idx_carousel_items_display_order ON carousel_items(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_items_active ON carousel_items(active);

-- Enable Row Level Security
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to active carousel items" ON carousel_items;
DROP POLICY IF EXISTS "Admin full access to carousel items" ON carousel_items;

-- Policy: Anyone can view active carousel items
CREATE POLICY "Public read access to active carousel items"
  ON carousel_items
  FOR SELECT
  USING (active = true);

-- Policy: Authenticated users can do everything (simplified - you can restrict later)
CREATE POLICY "Admin full access to carousel items"
  ON carousel_items
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create storage bucket for carousel images
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-images', 'carousel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public read access to carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access to carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access to carousel images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access to carousel images" ON storage.objects;

-- Storage policy: Public read access
CREATE POLICY "Public read access to carousel images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'carousel-images');

-- Storage policy: Authenticated users can upload
CREATE POLICY "Admin upload access to carousel images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'carousel-images' AND
    auth.role() = 'authenticated'
  );

-- Storage policy: Authenticated users can update
CREATE POLICY "Admin update access to carousel images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'carousel-images' AND
    auth.role() = 'authenticated'
  );

-- Storage policy: Authenticated users can delete
CREATE POLICY "Admin delete access to carousel images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'carousel-images' AND
    auth.role() = 'authenticated'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_carousel_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS carousel_items_updated_at ON carousel_items;

-- Create trigger to automatically update updated_at
CREATE TRIGGER carousel_items_updated_at
  BEFORE UPDATE ON carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_items_updated_at();

-- Insert sample carousel items (optional - delete if not needed)
INSERT INTO carousel_items (title, description, display_order, active) VALUES
  ('Bem-vindo ao nosso Salão', 'Descubra nossos serviços premium de beleza e bem-estar', 1, true),
  ('Tratamentos Especiais', 'Experimente nossos tratamentos exclusivos com produtos de alta qualidade', 2, true),
  ('Agende Online', 'Reserve seu horário de forma rápida e conveniente pelo nosso sistema', 3, true)
ON CONFLICT DO NOTHING;
