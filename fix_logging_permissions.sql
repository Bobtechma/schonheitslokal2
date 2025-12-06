-- Fix for "booking confirmation error" caused by RLS on activity_logs
-- When an anonymous user creates an appointment, the trigger tries to insert into activity_logs.
-- Since there is no RLS policy allowing 'anon' to insert into activity_logs, it fails.
-- The fix is to make the logging function SECURITY DEFINER, so it runs with admin privileges.

CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_client_id UUID,
    p_action_type VARCHAR(100),
    p_entity_type VARCHAR(100),
    p_entity_id UUID,
    p_old_values JSONB,
    p_new_values JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_logs (
        user_id,
        client_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_user_id,
        p_client_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_old_values,
        p_new_values,
        current_setting('app.current_ip', true)::INET,
        current_setting('app.current_user_agent', true),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also grant INSERT permission on activity_logs to authenticated and anon, just in case
GRANT INSERT ON activity_logs TO anon, authenticated;
