-- Fix for "structure of query does not match function result type" error
-- The issue is that SUM(integer) returns BIGINT, but the function expects INTEGER.
-- We need to cast the result to INTEGER.

CREATE OR REPLACE FUNCTION calculate_appointment_totals(p_appointment_id UUID)
RETURNS TABLE(total_price DECIMAL, total_duration INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(price_at_time), 0)::DECIMAL as total_price,
        COALESCE(SUM(duration_at_time), 0)::INTEGER as total_duration
    FROM appointment_services
    WHERE appointment_id = p_appointment_id;
END;
$$ LANGUAGE plpgsql;
