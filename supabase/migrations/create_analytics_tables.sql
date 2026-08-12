-- Create table for page views
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Optional: track logged-in users
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search index for faster querying by date and path
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);

-- Add views column to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'views') THEN
        ALTER TABLE services ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
END $$;


-- Function to increment page view (RPC)
CREATE OR REPLACE FUNCTION increment_page_view(p_page_path TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO page_views (page_path, user_id)
    VALUES (p_page_path, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to increment service view (RPC)
CREATE OR REPLACE FUNCTION increment_service_view(p_service_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE services
    SET views = views + 1
    WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS JSON AS $$
DECLARE
    v_total_page_views INTEGER;
    v_total_appointments INTEGER;
    v_total_products_sold INTEGER;
    v_services_revenue DECIMAL(10, 2);
    v_products_revenue DECIMAL(10, 2);
    v_total_revenue DECIMAL(10, 2);
    v_most_viewed_services JSON;
    v_most_viewed_products JSON;
    v_most_booked_services JSON;
    v_most_sold_products JSON;
BEGIN
    -- 1. Total Page Views
    SELECT COUNT(*) INTO v_total_page_views
    FROM page_views
    WHERE viewed_at >= p_start_date AND viewed_at <= p_end_date;

    -- 2. Total Appointments (Confirmed or Completed) based on date range
    SELECT COUNT(*) INTO v_total_appointments
    FROM appointments
    WHERE appointment_date >= p_start_date::DATE AND appointment_date <= p_end_date::DATE
    AND status IN ('confirmed', 'completed');

    -- 3. Revenue Analysis (Services vs Products)
    -- We need to look at appointment_services joined with services table to distinguish types
    
    -- Calculate total service revenue (category != 'product')
    SELECT COALESCE(SUM(aps.price_at_time), 0) INTO v_services_revenue
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.appointment_date >= p_start_date::DATE AND a.appointment_date <= p_end_date::DATE
    AND a.status IN ('confirmed', 'completed') -- Only count confirmed/completed
    AND s.category != 'product';

    -- Calculate total product revenue (category = 'product')
    SELECT COALESCE(SUM(aps.price_at_time), 0) INTO v_products_revenue
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.appointment_date >= p_start_date::DATE AND a.appointment_date <= p_end_date::DATE
    AND a.status IN ('confirmed', 'completed')
    AND s.category = 'product';
    
    -- Calculate total products sold count
    SELECT COUNT(*) INTO v_total_products_sold
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.appointment_date >= p_start_date::DATE AND a.appointment_date <= p_end_date::DATE
    AND a.status IN ('confirmed', 'completed')
    AND s.category = 'product';

    v_total_revenue := v_services_revenue + v_products_revenue;

    -- 4. Most Viewed Services (Top 5) - Note: 'views' is lifetime, not time-ranged easily without a separate 'service_views' table
    -- For simplicity, we return lifetime views here as requests, or we could add a tracking table later.
    -- The requested view for "most viewed" usually implies "of all time" or "currently popular".
    -- Since we only added 'views' column which is a counter, we can only return current counter.
    SELECT json_agg(t) INTO v_most_viewed_services
    FROM (
        SELECT name, views
        FROM services
        WHERE category != 'product'
        ORDER BY views DESC
        LIMIT 5
    ) t;

    -- 5. Most Viewed Products (Top 5)
    SELECT json_agg(t) INTO v_most_viewed_products
    FROM (
        SELECT name, views
        FROM services
        WHERE category = 'product'
        ORDER BY views DESC
        LIMIT 5
    ) t;
    
    -- 6. Most Booked Services (in range)
    SELECT json_agg(t) INTO v_most_booked_services
    FROM (
        SELECT s.name, COUNT(*) as count
        FROM appointment_services aps
        JOIN appointments a ON aps.appointment_id = a.id
        JOIN services s ON aps.service_id = s.id
        WHERE a.appointment_date >= p_start_date::DATE AND a.appointment_date <= p_end_date::DATE
        AND a.status IN ('confirmed', 'completed')
        AND s.category != 'product'
        GROUP BY s.name
        ORDER BY count DESC
        LIMIT 5
    ) t;

    RETURN json_build_object(
        'total_page_views', v_total_page_views,
        'total_appointments', v_total_appointments,
        'total_products_sold', v_total_products_sold,
        'services_revenue', v_services_revenue,
        'products_revenue', v_products_revenue,
        'total_revenue', v_total_revenue,
        'most_viewed_services', COALESCE(v_most_viewed_services, '[]'::json),
        'most_viewed_products', COALESCE(v_most_viewed_products, '[]'::json),
        'most_booked_services', COALESCE(v_most_booked_services, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for RPC
GRANT EXECUTE ON FUNCTION increment_page_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_service_view(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT SELECT ON page_views TO authenticated;
