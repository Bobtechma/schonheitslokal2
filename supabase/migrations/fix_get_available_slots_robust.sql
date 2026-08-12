-- Arquivo de referência para a correção

-- Problemas a corrigir manualmente no Supabase:

-- 1. Verificar se a função atual existe:
-- SELECT proname FROM pg_proc WHERE proname = 'get_available_slots';

-- 2. Testar a função atual:
-- SELECT * FROM get_available_slots('2024-01-15', ARRAY['service-uuid-aqui'], NULL);

-- 3. Se der erro, verificar profissional_service:
-- SELECT * FROM professional_services WHERE service_id = 'service-uuid-aqui';

-- 4. Verificar appointments órfãos (sem profissional):
-- SELECT * FROM appointments WHERE professional_id IS NULL;