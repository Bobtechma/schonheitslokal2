-- Enable RLS on system_settings table
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON system_settings;
DROP POLICY IF EXISTS "Admins/Owners full access" ON system_settings;
DROP POLICY IF EXISTS "Owners can update settings" ON system_settings;

-- Allow everyone to read settings (needed for calculating prices on booking page)
CREATE POLICY "Public read access"
ON system_settings FOR SELECT
USING (true);

-- Allow Admins and Owners to do everything (Insert, Update, Delete)
CREATE POLICY "Admins/Owners full access"
ON system_settings FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
);
