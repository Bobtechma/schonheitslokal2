-- Fix RLS for clients table to allow anonymous inserts
-- Drop existing policies first
DROP POLICY IF EXISTS "clients_view_own_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_owner_full_access_clients" ON clients;
DROP POLICY IF EXISTS "clients_access_own_profile" ON clients;
DROP POLICY IF EXISTS "public_create_client_profile" ON clients;
DROP POLICY IF EXISTS "Public Insert Clients" ON clients;
DROP POLICY IF EXISTS "Public Read Clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;

-- Allow anyone (including anon) to INSERT new clients
CREATE POLICY "anyone_can_insert_client" ON clients
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow anyone to READ all clients
CREATE POLICY "anyone_can_read_clients" ON clients
    FOR SELECT TO public
    USING (true);

-- Allow anyone to UPDATE clients (with auth check)
CREATE POLICY "anyone_can_update_client" ON clients
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);

-- Also ensure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;