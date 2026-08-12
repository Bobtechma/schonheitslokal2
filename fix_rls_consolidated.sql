-- Consolidated RLS Fix for Admin/Owner Visibility and Security

-- 1. Helper function to check for admin or owner role consistently
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')) OR
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'owner'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APPOINTMENTS Policies
DROP POLICY IF EXISTS "Public read access to appointments" ON appointments;
DROP POLICY IF EXISTS "Public insert access to appointments" ON appointments;
DROP POLICY IF EXISTS "appointments_select_own" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON appointments;
DROP POLICY IF EXISTS "admin_select_all_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_update_all_appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and owners can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and owners can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and owners can update all appointments" ON appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON appointments;
DROP POLICY IF EXISTS "Public Insert Appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Public and Authenticated insert access" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON appointments;
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;

-- Allow Admins/Owners full control
CREATE POLICY "admin_owner_full_access_appointments" ON appointments
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner())
    WITH CHECK (public.is_admin_or_owner());

-- Allow Clients to view their own appointments
CREATE POLICY "clients_view_own_appointments" ON appointments
    FOR SELECT TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM clients WHERE id = appointments.client_id));

-- Allow Public/Anon to book (Insert only)
CREATE POLICY "public_book_appointments" ON appointments
    FOR INSERT TO public
    WITH CHECK (true);

-- 3. CLIENTS Policies
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "admin_select_all_clients" ON clients;
DROP POLICY IF EXISTS "admin_update_all_clients" ON clients;
DROP POLICY IF EXISTS "Admins and owners can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins and owners can update all clients" ON clients;
DROP POLICY IF EXISTS "Public read access to clients" ON clients;
DROP POLICY IF EXISTS "Public insert access to clients" ON clients;
DROP POLICY IF EXISTS "Public update access to clients" ON clients;
DROP POLICY IF EXISTS "Public Read Clients" ON clients;
DROP POLICY IF EXISTS "Public Insert Clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;

CREATE POLICY "admin_owner_full_access_clients" ON clients
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner())
    WITH CHECK (public.is_admin_or_owner());

CREATE POLICY "clients_access_own_profile" ON clients
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_create_client_profile" ON clients
    FOR INSERT TO public
    WITH CHECK (true);

-- 4. SERVICES Policies
DROP POLICY IF EXISTS "services_select_all" ON services;
DROP POLICY IF EXISTS "admin_manage_services" ON services;
DROP POLICY IF EXISTS "Admins and owners can manage services" ON services;
DROP POLICY IF EXISTS "Public read access to services" ON services;
DROP POLICY IF EXISTS "Public read access" ON services;
DROP POLICY IF EXISTS "Admin/Owner full access" ON services;
DROP POLICY IF EXISTS "Public read access for services" ON services;
DROP POLICY IF EXISTS "Public Read Services" ON services;

CREATE POLICY "admin_owner_manage_services" ON services
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner())
    WITH CHECK (public.is_admin_or_owner());

CREATE POLICY "public_read_services" ON services
    FOR SELECT TO public
    USING (true);

-- 5. SYSTEM SETTINGS Policies
DROP POLICY IF EXISTS "Admins and owners can manage settings" ON system_settings;
-- (Add other dynamic drops if necessary, but these are usually few)

CREATE POLICY "admin_owner_manage_system_settings" ON system_settings
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner())
    WITH CHECK (public.is_admin_or_owner());

CREATE POLICY "public_read_system_settings" ON system_settings
    FOR SELECT TO public
    USING (true);

-- Enable RLS on everyone (just in case they were off)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_options ENABLE ROW LEVEL SECURITY;

-- Apply Admin/Owner full access to remaining tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('business_hours', 'blocked_dates', 'blocked_slots', 'carousel_items', 'shipping_options')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "admin_owner_access" ON %I', t);
        EXECUTE format('CREATE POLICY "admin_owner_access" ON %I FOR ALL TO authenticated USING (public.is_admin_or_owner()) WITH CHECK (public.is_admin_or_owner())', t);
        EXECUTE format('DROP POLICY IF EXISTS "public_read" ON %I', t);
        EXECUTE format('CREATE POLICY "public_read" ON %I FOR SELECT TO public USING (true)', t);
    END LOOP;
END;
$$;
