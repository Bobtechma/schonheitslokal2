-- Fix permissions for anonymous users (booking without login)

-- 1. Grant INSERT and UPDATE permissions to the 'anon' role
GRANT INSERT, UPDATE ON clients TO anon;
GRANT INSERT, UPDATE ON appointments TO anon;
GRANT INSERT, UPDATE ON appointment_services TO anon;

-- 2. Create RLS policies to allow anonymous inserts
-- Clients
CREATE POLICY "anon_insert_clients" ON clients 
FOR INSERT WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "anon_update_clients" ON clients 
FOR UPDATE USING (auth.uid() IS NULL);

-- Appointments
CREATE POLICY "anon_insert_appointments" ON appointments 
FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Appointment Services
CREATE POLICY "anon_insert_appointment_services" ON appointment_services 
FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- 3. Ensure sequences are accessible (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
