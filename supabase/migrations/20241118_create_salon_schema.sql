-- Sistema de Agendamento de Salão de Beleza
-- Esquema do banco de dados PostgreSQL

-- Tabela de clientes (extende auth.users)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    birth_date DATE,
    gender VARCHAR(20),
    allergies TEXT,
    preferences TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_cpf ON clients(cpf);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Tabela de serviços
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para services
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_display_order ON services(display_order);

-- Tabela de agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    total_duration_minutes INTEGER NOT NULL CHECK (total_duration_minutes > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Índices para appointments
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);

-- Tabela de relacionamento agendamentos-serviços
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    price_at_time DECIMAL(10,2) NOT NULL,
    duration_at_time INTEGER NOT NULL,
    UNIQUE(appointment_id, service_id, order_index)
);

-- Índices para appointment_services
CREATE INDEX idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service_id ON appointment_services(service_id);

-- Tabela de logs de atividade
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_client_id ON activity_logs(client_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Tabela de configurações do sistema
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de horários de funcionamento
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de horários indisponíveis (bloqueios)
CREATE TABLE blocked_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_times_date ON blocked_times(date);
CREATE INDEX idx_blocked_times_date_range ON blocked_times(date, start_time, end_time);

-- Inserir dados iniciais
INSERT INTO services (name, description, duration_minutes, price, category, display_order) VALUES
('Manicure Básica', 'Tratamento completo de unhas das mãos', 60, 80.00, 'Unhas', 1),
('Pedicure Básica', 'Tratamento completo de unhas dos pés', 60, 90.00, 'Unhas', 2),
('Manicure e Pedicure', 'Combo completo de unhas', 120, 150.00, 'Unhas', 3),
('Corte de Cabelo Feminino', 'Corte e finalização', 90, 120.00, 'Cabelos', 4),
('Corte de Cabelo Masculino', 'Corte e acabamento', 45, 60.00, 'Cabelos', 5),
('Escova Progressiva', 'Alisamento térmico', 180, 350.00, 'Cabelos', 6),
('Botox Capilar', 'Hidratação intensiva', 120, 280.00, 'Cabelos', 7),
('Limpeza de Pele', 'Limpeza profunda facial', 90, 150.00, 'Estética', 8),
('Maquiagem', 'Maquiagem para eventos', 60, 100.00, 'Maquiagem', 9),
('Design de Sobrancelha', 'Modelagem e design', 30, 40.00, 'Estética', 10);

-- Inserir horários de funcionamento padrão (segunda a sábado, 9h às 18h)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, '09:00', '18:00', false), -- Domingo
(1, '09:00', '18:00', false), -- Segunda
(2, '09:00', '18:00', false), -- Terça
(3, '09:00', '18:00', false), -- Quarta
(4, '09:00', '18:00', false), -- Quinta
(5, '09:00', '18:00', false), -- Sexta
(6, '09:00', '18:00', false); -- Sábado

-- Configurações iniciais do sistema
INSERT INTO system_settings (key, value, description) VALUES
('salon_name', 'Salão de Beleza', 'Nome do salão'),
('salon_phone', '(11) 99999-9999', 'Telefone de contato'),
('salon_email', 'contato@salaobeleza.com', 'Email de contato'),
('salon_address', 'Rua Exemplo, 123 - São Paulo/SP', 'Endereço do salão'),
('cancellation_policy', 'Cancelamentos devem ser realizados com no mínimo 24 horas de antecedência.', 'Política de cancelamento'),
('booking_advance_days', '30', 'Quantidade de dias antecedência permitida para agendamento'),
('reminder_hours', '24', 'Horas antes do agendamento para envio de lembrete'),
('currency', 'BRL', 'Moeda utilizada (BRL, USD, EUR)'),
('timezone', 'America/Sao_Paulo', 'Fuso horário'),
('google_translate_enabled', 'true', 'Habilitar tradução automática');