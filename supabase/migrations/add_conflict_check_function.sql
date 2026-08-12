-- Add conflict check function for appointments
-- This function checks if there's a scheduling conflict before creating an appointment

-- First, drop the existing function and recreate it with conflict checking
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
  v_conflict_exists BOOLEAN := FALSE;
  v_conflict_count INTEGER := 0;
  v_prof_id UUID;
BEGIN
  -- Check for conflicts only if professional is specified and it's not a product order
  IF p_professional_id IS NOT NULL AND p_total_duration > 0 THEN
    -- Check if there's an existing appointment at the same time for this professional
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE professional_id = p_professional_id
      AND appointment_date = p_appointment_date
      AND appointment_time = p_appointment_time
      AND status NOT IN ('cancelled', 'no_show');
    
    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'CONFLICT: Já existe um agendamento neste horário para este profissional';
    END IF;
    
    -- Also check overlapping appointments (same professional, overlapping time)
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE professional_id = p_professional_id
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        -- New appointment starts during an existing one
        (p_appointment_time >= appointment_time AND p_appointment_time < (appointment_time + (total_duration_minutes || ' minutes')::interval))
        OR
        -- Existing appointment starts during the new one (if we knew the exact duration end)
        (appointment_time >= p_appointment_time AND appointment_time < (p_appointment_time + (p_total_duration || ' minutes')::interval))
      );
    
    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'CONFLICT: Este horário conflita com outro agendamento existente';
    END IF;
  END IF;

  -- If no professional is specified (any professional), just create the appointment
  -- The system will assign the first available professional
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

-- Also update the old signature version (for backwards compatibility)
CREATE OR REPLACE FUNCTION public.create_appointment_with_services(
  p_client_id UUID,
  p_user_id UUID,
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

GRANT EXECUTE ON FUNCTION public.create_appointment_with_services(UUID, UUID, DATE, TIME, TEXT, TEXT, DECIMAL, INTEGER, JSONB) TO authenticated;