-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins/Owners can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins/Owners can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins/Owners can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins/Owners can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Public insert access" ON appointments;

-- 1. View (SELECT)
-- Users can see their own
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

-- Admins/Owners can see all
CREATE POLICY "Admins/Owners can view all appointments"
ON appointments FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
);

-- 2. Insert
-- Allow public insert (for booking) or authenticated users
CREATE POLICY "Public insert access"
ON appointments FOR INSERT
WITH CHECK (true);

-- 3. Update
-- Admins/Owners can update all
CREATE POLICY "Admins/Owners can update appointments"
ON appointments FOR UPDATE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
);

-- 4. Delete
-- Admins/Owners can delete all
CREATE POLICY "Admins/Owners can delete appointments"
ON appointments FOR DELETE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
);
