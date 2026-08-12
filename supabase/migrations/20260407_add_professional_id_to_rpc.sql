-- Add professional_id parameter to create_appointment_with_services RPC function
CREATE OR REPLACE FUNCTION public.create_appointment_with_services(
  p_client_id UUID,
  p_user_id UUID,
  p_professional_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_status TEXT,
  p_notes TEXT,
  p_total_price DECIMAL,
  p_total_duration INTEGER,
  p_services JSONB
)
RETURNS UUID AS $$
DECLARE
  v_appointment_id UUID;
  v_idx INTEGER := 0;
BEGIN
  INSERT INTO appointments(
    client_id,
    user_id,
    professional_id,
    appointment_date,
    appointment_time,
    total_price,
    total_duration_minutes,
    status,
    notes,
    created_at
  ) VALUES (
    p_client_id,
    p_user_id,
    p_professional_id,
    p_appointment_date,
    p_appointment_time,
    p_total_price,
    p_total_duration,
    COALESCE(p_status, 'confirmed'),
    p_notes,
    NOW()
  ) RETURNING id INTO v_appointment_id;

  IF p_services IS NOT NULL AND jsonb_typeof(p_services) = 'array' THEN
    FOR v_idx IN 0..jsonb_array_length(p_services)-1 LOOP
      INSERT INTO appointment_services(
        appointment_id,
        service_id,
        order_index,
        price_at_time,
        duration_at_time
      ) VALUES (
        v_appointment_id,
        (p_services->v_idx->>'id')::UUID,
        v_idx,
        (p_services->v_idx->>'price')::DECIMAL,
        (p_services->v_idx->>'duration_minutes')::INTEGER
      );
    END LOOP;
  END IF;

  RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_appointment_with_services(UUID, UUID, UUID, DATE, TIME, TEXT, TEXT, DECIMAL, INTEGER, JSONB) TO authenticated;
