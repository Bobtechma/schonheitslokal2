-- Migração para criar o sistema de solicitações de parceiros e ajustar limites de pagamento

-- 1. Criar a tabela partner_requests
CREATE TABLE IF NOT EXISTS partner_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    salon_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS para partner_requests
DROP POLICY IF EXISTS "Anyone can insert partner requests" ON partner_requests;
CREATE POLICY "Anyone can insert partner requests" ON partner_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and owners can view all partner requests" ON partner_requests;
CREATE POLICY "Admins and owners can view all partner requests" ON partner_requests
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Admins and owners can update partner requests" ON partner_requests;
CREATE POLICY "Admins and owners can update partner requests" ON partner_requests
  FOR UPDATE USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Users can view their own partner requests" ON partner_requests;
CREATE POLICY "Users can view their own partner requests" ON partner_requests
  FOR SELECT USING (
    auth.uid() = user_id OR auth.jwt() ->> 'email' = email
  );

-- 4. Conceder privilégios de tabela
GRANT SELECT, INSERT ON partner_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON partner_requests TO authenticated;

-- 5. Ajustar a restrição de método de pagamento na tabela partner_orders (Remover Boleto)
ALTER TABLE partner_orders DROP CONSTRAINT IF EXISTS partner_orders_payment_method_check;
ALTER TABLE partner_orders ADD CONSTRAINT partner_orders_payment_method_check CHECK (payment_method IN ('credit_card'));

-- 6. Deletar a taxa de câmbio estática CHF-BRL das configurações
DELETE FROM system_settings WHERE key = 'partner_chf_to_brl_rate';
