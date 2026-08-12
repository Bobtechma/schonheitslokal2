-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_appointment_with_services;
DROP FUNCTION IF EXISTS public.create_appointment_with_services(UUID, UUID, DATE, TIME, TEXT, TEXT, DECIMAL, INTEGER, JSONB);
DROP FUNCTION IF EXISTS public.create_appointment_with_services(UUID, UUID, UUID, DATE, TIME, TEXT, TEXT, DECIMAL, INTEGER, JSONB);

-- Add payment columns first
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Enhanced RPC function with payment parameters
CREATE FUNCTION public.create_appointment_with_services(
  p_client_id UUID,
  p_user_id UUID,
  p_professional_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_status TEXT,
  p_notes TEXT,
  p_total_price DECIMAL,
  p_total_duration INTEGER,
  p_services JSONB,
  p_payment_method TEXT DEFAULT 'pending',
  p_payment_status TEXT DEFAULT 'pending',
  p_stripe_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_appointment_id UUID;
  v_idx INTEGER := 0;
  v_service_price DECIMAL;
  v_service_duration INTEGER;
  v_service_id UUID;
BEGIN
  INSERT INTO appointments(
    client_id, user_id, professional_id, appointment_date, appointment_time,
    total_price, total_duration_minutes, status, notes, created_at,
    payment_method, payment_status, stripe_payment_intent_id
  ) VALUES (
    p_client_id, p_user_id, p_professional_id, p_appointment_date, p_appointment_time,
    p_total_price, p_total_duration, COALESCE(p_status, 'confirmed'), p_notes, NOW(),
    COALESCE(p_payment_method, 'pending'), COALESCE(p_payment_status, 'pending'), p_stripe_id
  ) RETURNING id INTO v_appointment_id;

  IF p_services IS NOT NULL AND jsonb_typeof(p_services) = 'array' THEN
    FOR v_idx IN 0..jsonb_array_length(p_services)-1 LOOP
      v_service_id := (p_services->v_idx->>'id')::UUID;
      v_service_price := (p_services->v_idx->>'price')::DECIMAL;
      v_service_duration := (p_services->v_idx->>'duration_minutes')::INTEGER;
      
      INSERT INTO appointment_services(appointment_id, service_id, order_index, price_at_time, duration_at_time)
      VALUES (v_appointment_id, v_service_id, v_idx, v_service_price, v_service_duration);
    END LOOP;
  END IF;

  RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_appointment_with_services TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_appointment_with_services TO anon;