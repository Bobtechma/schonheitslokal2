-- Funções auxiliares e triggers para o sistema de agendamento

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON business_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para registrar logs de atividade
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
$$ LANGUAGE plpgsql;

-- Função para calcular preço e duração total de um agendamento
CREATE OR REPLACE FUNCTION calculate_appointment_totals(p_appointment_id UUID)
RETURNS TABLE(total_price DECIMAL, total_duration INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(price_at_time), 0) as total_price,
        COALESCE(SUM(duration_at_time), 0) as total_duration
    FROM appointment_services
    WHERE appointment_id = p_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION check_time_availability(
    p_date DATE,
    p_start_time TIME,
    p_duration_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_end_time TIME;
    v_business_start TIME;
    v_business_end TIME;
    v_blocked_count INTEGER;
BEGIN
    -- Calcular horário de término
    v_end_time := p_start_time + INTERVAL '1 minute' * p_duration_minutes;
    
    -- Verificar horário de funcionamento
    SELECT open_time, close_time
    INTO v_business_start, v_business_end
    FROM business_hours
    WHERE day_of_week = EXTRACT(DOW FROM p_date)
    AND is_closed = false
    LIMIT 1;
    
    IF v_business_start IS NULL OR v_business_end IS NULL THEN
        RETURN false; -- Está fechado
    END IF;
    
    -- Verificar se está dentro do horário de funcionamento
    IF p_start_time < v_business_start OR v_end_time > v_business_end THEN
        RETURN false;
    END IF;
    
    -- Verificar se há bloqueios de horário
    SELECT COUNT(*)
    INTO v_blocked_count
    FROM blocked_times
    WHERE date = p_date
    AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < v_end_time AND end_time >= v_end_time) OR
        (start_time >= p_start_time AND end_time <= v_end_time)
    );
    
    RETURN v_blocked_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Função para obter horários disponíveis em um dia específico
CREATE OR REPLACE FUNCTION get_available_times(
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(time_slot TIME, available BOOLEAN) AS $$
DECLARE
    v_business_start TIME;
    v_business_end TIME;
    v_current_time TIME;
    v_slot_duration INTEGER := 30; -- Intervalo de 30 minutos
BEGIN
    -- Obter horário de funcionamento
    SELECT open_time, close_time
    INTO v_business_start, v_business_end
    FROM business_hours
    WHERE day_of_week = EXTRACT(DOW FROM p_date)
    AND is_closed = false
    LIMIT 1;
    
    IF v_business_start IS NULL OR v_business_end IS NULL THEN
        RETURN; -- Está fechado, não retorna horários
    END IF;
    
    -- Gerar horários disponíveis
    v_current_time := v_business_start;
    
    WHILE v_current_time + INTERVAL '1 minute' * p_duration_minutes <= v_business_end LOOP
        time_slot := v_current_time;
        available := check_time_availability(p_date, v_current_time, p_duration_minutes);
        RETURN NEXT;
        v_current_time := v_current_time + INTERVAL '1 minute' * v_slot_duration;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar totais do agendamento após mudança nos serviços
CREATE OR REPLACE FUNCTION update_appointment_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_totals RECORD;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT * INTO v_totals FROM calculate_appointment_totals(NEW.appointment_id);
        UPDATE appointments 
        SET total_price = v_totals.total_price,
            total_duration_minutes = v_totals.total_duration,
            updated_at = NOW()
        WHERE id = NEW.appointment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT * INTO v_totals FROM calculate_appointment_totals(OLD.appointment_id);
        UPDATE appointments 
        SET total_price = v_totals.total_price,
            total_duration_minutes = v_totals.total_duration,
            updated_at = NOW()
        WHERE id = OLD.appointment_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar totais quando serviços são adicionados/removidos
CREATE TRIGGER update_appointment_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointment_services
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_totals();

-- Função para registrar log quando um agendamento é criado
CREATE OR REPLACE FUNCTION log_appointment_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        NEW.user_id,
        NEW.client_id,
        'appointment_created',
        'appointments',
        NEW.id,
        NULL,
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para log de criação de agendamento
CREATE TRIGGER log_appointment_creation_trigger
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_creation();

-- Função para registrar log quando um agendamento é atualizado
CREATE OR REPLACE FUNCTION log_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        auth.uid(),
        NEW.client_id,
        'appointment_updated',
        'appointments',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para log de atualização de agendamento
CREATE TRIGGER log_appointment_update_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_update();

-- Função para registrar log quando um cliente é criado
CREATE OR REPLACE FUNCTION log_client_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        NEW.user_id,
        NEW.id,
        'client_created',
        'clients',
        NEW.id,
        NULL,
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para log de criação de cliente
CREATE TRIGGER log_client_creation_trigger
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION log_client_creation();

-- Função para criar agendamento e seus serviços em uma única operação tipada
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