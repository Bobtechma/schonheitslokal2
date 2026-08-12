-- ========================================
-- CORREÇÃO DE INCONSISTÊNCIAS
-- Copie e execute одну a uma
-- ========================================

--- Query 1: Verificar appointments órfãos (sem profissional)
SELECT id, appointment_date, appointment_time, status 
FROM appointments 
WHERE professional_id IS NULL 
AND status NOT IN ('cancelled', 'completed', 'no_show');

--- Query 2: Cancelar appointments órfãos (CUIDADO: só execute se quiser)
-- UPDATE appointments 
-- SET status = 'cancelled', 
--     notes = COALESCE(notes, '') || ' [cancelado: profissional não atribuído]'
-- WHERE professional_id IS NULL 
-- AND status NOT IN ('cancelled', 'completed', 'no_show');

--- Query 3: Verificar serviços com duração 0 ou NULL
SELECT id, name, duration_minutes 
FROM services 
WHERE duration_minutes IS NULL OR duration_minutes <= 0;

--- Query 4: Verificar relationship profissional-serviço
SELECT p.name, COUNT(ps.service_id) as servicos
FROM professionals p
LEFT JOIN professional_services ps ON p.id = ps.professional_id
WHERE p.active = true
GROUP BY p.name
ORDER BY servicos;

--- Query 5: Verificar profissionais sem serviços cadastrados
SELECT p.name
FROM professionals p
LEFT JOIN professional_services ps ON p.id = ps.professional_id
WHERE p.active = true AND ps.id IS NULL;

--- Query 6: Testar função (substitua o UUID)
-- SELECT * FROM get_available_slots('2024-01-20', ARRAY[' uuid-do-servico '], NULL);