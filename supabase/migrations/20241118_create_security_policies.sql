-- Políticas de Segurança (Row Level Security) para o Sistema de Agendamento

-- Habilitar RLS nas tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- PERMISSÕES PARA CLIENTES
-- Clientes podem ver apenas seus próprios dados
CREATE POLICY "clients_select_own" ON clients
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Clientes podem inserir seus próprios dados
CREATE POLICY "clients_insert_own" ON clients
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Clientes podem atualizar apenas seus próprios dados
CREATE POLICY "clients_update_own" ON clients
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- PERMISSÕES PARA SERVIÇOS (visíveis para todos)
CREATE POLICY "services_select_all" ON services
    FOR SELECT USING (active = true);

-- PERMISSÕES PARA AGENDAMENTOS
-- Clientes podem ver apenas seus próprios agendamentos
CREATE POLICY "appointments_select_own" ON appointments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT c.user_id FROM clients c WHERE c.id = appointments.client_id
        )
    );

-- Clientes podem criar agendamentos (após criar perfil)
CREATE POLICY "appointments_insert_own" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT c.user_id FROM clients c WHERE c.id = appointments.client_id
        )
    );

-- Clientes podem atualizar apenas seus próprios agendamentos (cancelar)
CREATE POLICY "appointments_update_own" ON appointments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT c.user_id FROM clients c WHERE c.id = appointments.client_id
        )
    );

-- PERMISSÕES PARA ADMINISTRADORES E PROPRIETÁRIOS
-- Administradores podem ver todos os clientes
CREATE POLICY "admin_select_all_clients" ON clients
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Administradores podem atualizar todos os clientes
CREATE POLICY "admin_update_all_clients" ON clients
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Administradores podem ver todos os agendamentos
CREATE POLICY "admin_select_all_appointments" ON appointments
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Administradores podem criar agendamentos para clientes
CREATE POLICY "admin_insert_appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Administradores podem atualizar todos os agendamentos
CREATE POLICY "admin_update_all_appointments" ON appointments
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Administradores podem gerenciar serviços
CREATE POLICY "admin_manage_services" ON services
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- PERMISSÕES PARA APPOINTMENT_SERVICES
-- Clientes podem ver serviços de seus próprios agendamentos
CREATE POLICY "appointment_services_select_own" ON appointment_services
    FOR SELECT USING (
        auth.uid() IN (
            SELECT c.user_id FROM clients c 
            JOIN appointments a ON c.id = a.client_id 
            WHERE a.id = appointment_services.appointment_id
        )
    );

-- Administradores podem gerenciar todos os serviços de agendamentos
CREATE POLICY "admin_manage_appointment_services" ON appointment_services
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- PERMISSÕES PARA ACTIVITY_LOGS (apenas admins podem ver)
CREATE POLICY "admin_select_activity_logs" ON activity_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- PERMISSÕES PARA SYSTEM_SETTINGS (apenas admins podem ver e atualizar)
CREATE POLICY "admin_select_settings" ON system_settings
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

CREATE POLICY "admin_update_settings" ON system_settings
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- PERMISSÕES PARA BUSINESS_HOURS (visível para todos, gerenciável por admins)
CREATE POLICY "business_hours_select_all" ON business_hours
    FOR SELECT USING (true);

CREATE POLICY "admin_manage_business_hours" ON business_hours
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- PERMISSÕES PARA BLOCKED_TIMES
-- Visível para todos (para calendário)
CREATE POLICY "blocked_times_select_all" ON blocked_times
    FOR SELECT USING (true);

-- Gerenciável apenas por admins
CREATE POLICY "admin_manage_blocked_times" ON blocked_times
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'owner')
    );

-- Conceder permissões básicas para anon e authenticated
GRANT SELECT ON clients TO anon;
GRANT ALL ON clients TO authenticated;

GRANT SELECT ON services TO anon;
GRANT ALL ON services TO authenticated;

GRANT SELECT ON appointments TO anon;
GRANT ALL ON appointments TO authenticated;

GRANT SELECT ON appointment_services TO anon;
GRANT ALL ON appointment_services TO authenticated;

GRANT SELECT ON activity_logs TO anon;
GRANT ALL ON activity_logs TO authenticated;

GRANT SELECT ON system_settings TO anon;
GRANT ALL ON system_settings TO authenticated;

GRANT SELECT ON business_hours TO anon;
GRANT ALL ON business_hours TO authenticated;

GRANT SELECT ON blocked_times TO anon;
GRANT ALL ON blocked_times TO authenticated;