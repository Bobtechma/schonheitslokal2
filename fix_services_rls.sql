-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON services;
DROP POLICY IF EXISTS "Admin/Owner full access" ON services;
DROP POLICY IF EXISTS "Admins can insert" ON services;
DROP POLICY IF EXISTS "Admins can update" ON services;
DROP POLICY IF EXISTS "Admins can delete" ON services;

-- Allow everyone to read services (needed for booking page)
CREATE POLICY "Public read access"
ON services FOR SELECT
USING (true);

-- Allow Admins and Owners to do everything (Insert, Update, Delete)
CREATE POLICY "Admin/Owner full access"
ON services FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
);
