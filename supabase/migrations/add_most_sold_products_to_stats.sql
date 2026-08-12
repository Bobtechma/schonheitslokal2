-- Function to get dashboard stats with REVENUE fixed to use created_at (Sale Date)
-- AND adding most_sold_products
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
    -- 1. Total Page Views (Unchanged)
    SELECT COUNT(*) INTO v_total_page_views
    FROM page_views
    WHERE viewed_at >= p_start_date AND viewed_at <= p_end_date;

    -- 2. Total Appointments (Operational Check: Who is coming?) -> Keep using appointment_date
    SELECT COUNT(*) INTO v_total_appointments
    FROM appointments
    WHERE appointment_date >= p_start_date::DATE AND appointment_date <= p_end_date::DATE
    AND status IN ('confirmed', 'completed');

    -- 3. Revenue Analysis (Sales Check: What did we sell?) -> Change to created_at
    
    -- Calculate total service revenue
    SELECT COALESCE(SUM(aps.price_at_time), 0) INTO v_services_revenue
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
    AND a.status IN ('confirmed', 'completed')
    AND s.category != 'product';

    -- Calculate total product revenue
    SELECT COALESCE(SUM(aps.price_at_time), 0) INTO v_products_revenue
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
    AND a.status IN ('confirmed', 'completed')
    AND s.category = 'product';
    
    -- Calculate total products sold count (Sales Check) -> Change to created_at
    SELECT COUNT(*) INTO v_total_products_sold
    FROM appointment_services aps
    JOIN appointments a ON aps.appointment_id = a.id
    JOIN services s ON aps.service_id = s.id
    WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
    AND a.status IN ('confirmed', 'completed')
    AND s.category = 'product';

    v_total_revenue := v_services_revenue + v_products_revenue;

    -- 4. Most Viewed Services (Top 5) - Unchanged
    SELECT json_agg(t) INTO v_most_viewed_services
    FROM (
        SELECT name, views
        FROM services
        WHERE category != 'product'
        ORDER BY views DESC
        LIMIT 5
    ) t;

    -- 5. Most Viewed Products (Top 5) - Unchanged
    SELECT json_agg(t) INTO v_most_viewed_products
    FROM (
        SELECT name, views
        FROM services
        WHERE category = 'product'
        ORDER BY views DESC
        LIMIT 5
    ) t;
    
    -- 6. Most Booked Services (Operational) -> Keep appointment_date
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

    -- 7. Most Sold Products (New)
    SELECT json_agg(t) INTO v_most_sold_products
    FROM (
        SELECT s.name, COUNT(*) as count
        FROM appointment_services aps
        JOIN appointments a ON aps.appointment_id = a.id
        JOIN services s ON aps.service_id = s.id
        WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
        AND a.status IN ('confirmed', 'completed')
        AND s.category = 'product'
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
        'most_booked_services', COALESCE(v_most_booked_services, '[]'::json),
        'most_sold_products', COALESCE(v_most_sold_products, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
