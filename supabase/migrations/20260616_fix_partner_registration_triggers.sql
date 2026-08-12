-- Migração para corrigir permissões de role, adicionar triggers de registro de parceiros e ajustar search_path de triggers de log

-- 1. Adicionar coluna role na tabela clients se não existir
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'client';

-- 2. Atualizar a coluna role existente com base no auth.users
UPDATE public.clients c
SET role = COALESCE(
    (u.raw_app_meta_data->>'role'),
    (u.raw_user_meta_data->>'role'),
    'client'
)
FROM auth.users u
WHERE c.user_id = u.id;

-- 3. Corrigir search_path das funções de trigger de log existentes para evitar erros em contextos sem schema public no path
CREATE OR REPLACE FUNCTION public.log_client_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_activity(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_appointment_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_activity(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_activity(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Função do trigger para definir a role no auth.users antes da inserção
CREATE OR REPLACE FUNCTION public.handle_new_user_partner_role()
RETURNS TRIGGER AS $$
DECLARE
    v_has_approved_request BOOLEAN;
BEGIN
    -- Verificar se existe solicitação de parceria aprovada para este e-mail
    SELECT EXISTS(
        SELECT 1 FROM public.partner_requests 
        WHERE lower(email) = lower(NEW.email) AND status = 'approved'
    ) INTO v_has_approved_request;
    
    IF v_has_approved_request THEN
        -- Definir role como partner no app_metadata e user_metadata
        NEW.raw_app_meta_data := jsonb_set(COALESCE(NEW.raw_app_meta_data, '{}'::jsonb), '{role}', '"partner"'::jsonb, true);
        NEW.raw_user_meta_data := jsonb_set(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), '{role}', '"partner"'::jsonb, true);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger BEFORE INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
CREATE TRIGGER on_auth_user_created_set_role
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_partner_role();

-- 5. Função do trigger para executar após a criação do usuário no auth.users
CREATE OR REPLACE FUNCTION public.handle_after_user_created()
RETURNS TRIGGER AS $$
DECLARE
    v_request_id UUID;
    v_owner_name TEXT;
    v_phone TEXT;
    v_salon_name TEXT;
    v_is_partner BOOLEAN;
BEGIN
    -- Buscar a solicitação de parceria aprovada para este e-mail
    SELECT id, owner_name, phone, salon_name INTO v_request_id, v_owner_name, v_phone, v_salon_name
    FROM public.partner_requests
    WHERE lower(email) = lower(NEW.email) AND status = 'approved'
    LIMIT 1;

    v_is_partner := v_request_id IS NOT NULL;

    -- Inserir ou atualizar na tabela clients
    IF EXISTS (SELECT 1 FROM public.clients WHERE user_id = NEW.id) THEN
        UPDATE public.clients
        SET 
            role = CASE WHEN v_is_partner THEN 'partner' ELSE 'client' END,
            phone = COALESCE(v_phone, phone),
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', v_owner_name, full_name),
            updated_at = NOW()
        WHERE user_id = NEW.id;
    ELSE
        INSERT INTO public.clients (user_id, full_name, phone, email, role)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', v_owner_name, 'Cliente'),
            COALESCE(v_phone, ''),
            NEW.email,
            CASE WHEN v_is_partner THEN 'partner' ELSE 'client' END
        );
    END IF;

    -- Se for parceiro, atualizar a tabela de solicitações para associar o user_id
    IF v_is_partner THEN
        UPDATE public.partner_requests
        SET user_id = NEW.id, updated_at = NOW()
        WHERE id = v_request_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger AFTER INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_after ON auth.users;
CREATE TRIGGER on_auth_user_created_after
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_after_user_created();
