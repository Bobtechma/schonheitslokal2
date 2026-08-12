-- ========================================
-- CORREÇÃO DE INCONSISTÊNCIAS
-- Execute uma query por vez
-- ========================================

-- ========================================
-- 1. CORRIGIR appointments órfãos (sem profissional)
-- ========================================
-- Primeiro, ver quantos existem:
SELECT COUNT(*) as orfaos FROM appointments WHERE professional_id IS NULL AND status NOT IN ('cancelled', 'completed', 'no_show');

-- Para corrigir, rodar só se quiser cancelar:
-- UPDATE appointments SET status = 'cancelled' WHERE professional_id IS NULL AND status NOT IN ('cancelled', 'completed', 'no_show');

-- ========================================
-- 2. Verificar serviços com problema
-- ========================================
SELECT id, name, duration_minutes FROM services WHERE duration_minutes IS NULL OR duration_minutes <= 0;

-- ========================================
-- 3. Verificar relationship profissional-serviço
-- ========================================
SELECT p.name, COUNT(ps.service_id) as total_servicos
FROM professionals p
LEFT JOIN professional_services ps ON p.id = ps.professional_id
WHERE p.active = true
GROUP BY p.name
ORDER BY total_servicos DESC;

-- ========================================
-- 4. Verificar se há profissionais sem serviços
-- ========================================
SELECT p.name
FROM professionals p
LEFT JOIN professional_services ps ON p.id = ps.professional_id
WHERE p.active = true AND ps.id IS NULL;

-- ========================================
-- 5. Testar função de disponibilidade
-- ========================================
-- Substitua o UUID pelo ID de um serviço existente
-- SELECT * FROM get_available_slots('2024-01-15', ARRAY[' uuid-do-servico-aqui '], NULL);