-- Enable RLS on tables if not already enabled
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 1. Services: Public Read
CREATE POLICY "Public Read Services" ON services
FOR SELECT TO anon, authenticated
USING (true);

-- 2. Business Hours: Public Read
CREATE POLICY "Public Read Business Hours" ON business_hours
FOR SELECT TO anon, authenticated
USING (true);

-- 3. Blocked Dates: Public Read
CREATE POLICY "Public Read Blocked Dates" ON blocked_dates
FOR SELECT TO anon, authenticated
USING (true);

-- 4. Blocked Slots: Public Read
CREATE POLICY "Public Read Blocked Slots" ON blocked_slots
FOR SELECT TO anon, authenticated
USING (true);

-- 5. System Settings: Public Read (Maybe restrict by key if sensitive? For now open as frontend needs it)
CREATE POLICY "Public Read System Settings" ON system_settings
FOR SELECT TO anon, authenticated
USING (true);

-- 6. Carousel Items: Public Read
CREATE POLICY "Public Read Carousel Items" ON carousel_items
FOR SELECT TO anon, authenticated
USING (true);

-- 7. Professionals: Public Read
CREATE POLICY "Public Read Professionals" ON professionals
FOR SELECT TO anon, authenticated
USING (true);

-- 8. Appointments: Public Read (for checking availability)
CREATE POLICY "Public Read Appointments" ON appointments
FOR SELECT TO anon, authenticated
USING (true);

-- 9. Appointments: Public Insert (for booking)
CREATE POLICY "Public Insert Appointments" ON appointments
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 10. Clients: Public Insert (for new clients)
CREATE POLICY "Public Insert Clients" ON clients
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 11. Clients: Read own data?
-- The frontend actively searches clients by email/phone.
-- Allowing arbitrary select on clients is risky (scraping).
-- Ideally, we'd use a Secure Function to look up client ID.
-- For now, to unblock the 401 without rewriting frontend logic, we might need a limited read policy.
-- A common pattern for anon booking is enabling SELECT but maybe checking against specific criteria isn't easily done in RLS without a WHERE clause in the query, which RLS doesn't "see" the same way.
-- SAFER: Create a function to find client.
-- QUICKER FIX (User's request): Allow SELECT on clients.
CREATE POLICY "Public Read Clients" ON clients
FOR SELECT TO anon, authenticated
USING (true);
