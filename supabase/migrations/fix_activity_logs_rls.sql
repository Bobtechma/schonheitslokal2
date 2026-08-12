-- Fix: Allow public to insert into activity_logs (needed for client creation trigger)
GRANT INSERT ON activity_logs TO anon, authenticated;

-- Create policy to allow public inserts
DROP POLICY IF EXISTS "public_insert_activity_logs" ON activity_logs;

CREATE POLICY "public_insert_activity_logs" ON activity_logs
    FOR INSERT TO public
    WITH CHECK (true);

-- Also allow SELECT
DROP POLICY IF EXISTS "public_select_activity_logs" ON activity_logs;

CREATE POLICY "public_select_activity_logs" ON activity_logs
    FOR SELECT TO public
    USING (true);

-- Ensure RLS is working
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;