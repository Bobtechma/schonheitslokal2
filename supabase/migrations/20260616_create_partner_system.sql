-- Migração para estruturar o sistema de Salões Parceiros

-- 1. Inserir configurações padrão em system_settings
INSERT INTO system_settings (key, value, description) VALUES
('partner_discount_pct', '30', 'Porcentagem de desconto padrão para salões parceiros'),
('partner_min_order_amount', '100.00', 'Valor mínimo de pedido para salões parceiros'),
('partner_chf_to_brl_rate', '6.00', 'Taxa de câmbio estática para conversão de CHF para BRL no checkout por Boleto'),
('partner_contract_text_de', 'PARTNERSCHAFTS- UND VERTRIEBSVERTRAG

ZWISCHEN:
[Name Ihres Unternehmens / Rechtsform], handelnd unter der Marke Schönheitslokal, mit Sitz in Zürich, Schweiz, CHE-[Ihre UID-Nummer], vertreten durch Silvia Frick (nachfolgend "Lieferantin" genannt);
UND:
[Name des Partnersalons / Firmenname], mit Sitz in [Adresse des Partnersalons], Schweiz, CHE-[UID-Nummer des Partnersalons], vertreten durch [Name des Vertreters] (nachfolgend "Partnersalon" genannt).

Die Lieferantin und der Partnersalon werden einzeln als "Partei" und gemeinsam als "Parteien" bezeichnet.

ARTIKEL 1: GEGENSTAND DES VERTRAGS
Gegenstand dieses Vertrages ist die Regelung der kommerziellen Partnerschaft für den Kauf, Vertrieb und selektiven Wiederverkauf von Kosmetikprodukten der Lieferantin in den Räumlichkeiten und über die digitalen Kanäle des Partnersalons.

ARTIKEL 2: PREISE UND HANDELSRABATT
1. Der Partnersalon erhält einen festen Rabatt von 30% (dreissig Prozent) auf den empfohlenen Verkaufspreis (UVP/MSRP) für alle von der Lieferantin bezogenen Kosmetikprodukte.
2. Die aktuelle Preisliste wird diesem Vertrag als Anhang A beigefügt und kann von der Lieferantin mit einer Frist von 30 Tagen schriftlich angepasst werden.

ARTIKEL 3: ZAHLUNGSBEDINGUNGEN FÜR DIE ERSTBESTELLUNG
Für die bei Vertragsabschluss erworbene Erstbestellung (Lagerbestand) vereinbaren die Parteien folgende spezifische Zahlungsbedingungen:
1. 50% (fünfzig Prozent) des gesamten Netto-Rechnungsbetrages sind im Moment der Unterzeichnung dieses Vertrages zur Zahlung fällig.
2. Die verbleibenden 50% (fünfzig Prozent) sind innerhalb von 30 (dreissig) Kalendertagen nach der Unterzeichnung dieses Vertrages zu zahlen.
3. Bei Zahlungsverzug wird ohne Mahnung ein gesetzlicher Verzugszins von 5% pro Jahr (Art. 104 OR) fällig. Die Lieferantin behält sich das Recht vor, weitere Produktlieferungen bis zur vollständigen Bezahlung einzustellen.

ARTIKEL 4: GEISTIGES EIGENTUM UND MARKENNUTZUNG
1. Die Lieferantin gewährt dem Partnersalon eine beschränkte, widerrufliche, nicht übertragbare und nicht exklusive Lizenz zur Nutzung der Marken, Logos und Werbematerialien von Schönheitslokal ausschliesslich für den Marketing- und Vertriebszweck der Produkte während der Vertragslaufzeit.
2. Der Partnersalon verpflichtet sich, das Premium-Image und die visuelle Identität der Marke zu wahren.

ARTIKEL 5: DAUER UND KÜNDIGUNG
1. Dieser Vertrag tritt mit der Unterzeichnung beider Parteien in Kraft und gilt für eine feste Dauer von [z.B. 12 Monaten]. Er verlängert sich automatisch um jeweils den gleichen Zeitraum, sofern er nicht von einer Partei mit einer Frist von [z.B. 3 Monaten] schriftlich per Einschreiben gekündigt wird.
2. Das Recht zur fristlosen Kündigung aus wichtigem Grund (Art. 107 ff. OR) bleibt jederzeit vorbehalten, insbesondere wenn eine Partei wesentliche Vertragspflichten verletzt und diese trotz schriftlicher Abmahnung nicht innerhalb von 15 Tagen behebt.

ARTIKEL 6: ANWENDBARES RECHT UND GERICHTSSTAND
1. Dieser Vertrag unterliegt ausschliesslich schweizerischem Recht (unter Ausschluss des UN Kaufrechts / CISG).
2. Ausschliesslicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Zürich, Schweiz.

Zürich, am __________________
Für die Lieferantin (Schönheitslokal): Silvia Frick

Ort/Datum: __________________
Für den Partnersalon: [Name und Funktion des Vertreters]', 'Contrato de Parceria em Alemão'),
('partner_contract_text_pt', 'CONTRATO DE PARCERIA E DISTRIBUIÇÃO

ENTRE:
[Nome da sua Empresa / Forma Jurídica], atuando sob a marca Schönheitslokal, com sede em Zurique, Suíça, CHE-[Seu Número UID], representada por Silvia Frick (doravante denominada "Fornecedora");
E:
[Nome do Salão Parceiro / Nome da Empresa], com sede em [Endereço do Salão Parceiro], Suíça, CHE-[Número UID do Salão Parceiro], representado por [Nome do Representante] (doravante denominado "Salão Parceiro").

A Fornecedora e o Salão Parceiro serão referidos individualmente como "Parte" e coletivamente como "Partes".

ARTIGO 1: OBJETO DO CONTRATO
O objeto deste contrato é a regulamentação da parceria comercial para a compra, distribuição e revenda seletiva dos produtos cosméticos da Fornecedora nas instalações e canais digitais do Salão Parceiro.

ARTIGO 2: PREÇOS E DESCONTO COMERCIAL
1. O Salão Parceiro receberá um desconto fixo de 30% (trinta por cento) sobre o preço sugerido de venda (UVP/MSRP) para todos os produtos cosméticos adquiridos da Fornecedora.
2. A lista de preços atual é anexada a este contrato como Anexo A e pode ser alterada por escrito pela Fornecedora mediante aviso prévio de 30 dias.

ARTIGO 3: CONDIÇÕES DE PAGAMENTO PARA O PRIMEIRO PEDIDO
Para o primeiro pedido (estoque inicial) acordado no momento da assinatura do contrato, as partes estabelecem as seguintes condições específicas de pagamento:
1. 50% (cinquenta por cento) do valor líquido total da fatura deve ser pago no momento da assinatura deste contrato.
2. Os 50% (cinquenta por cento) restantes devem ser pagos no prazo de 30 (trinta) dias corridos após a assinatura deste contrato.
3. Em caso de atraso no pagamento, incidirão juros moratórios legais de 5% ao ano (Art. 104 CO) sem necessidade de notificação prévia. A Fornecedora reserva-se o direito de suspender futuras entregas de produtos até o pagamento integral.

ARTIGO 4: PROPRIEDADE INTELECTUAL E USO DA MARCA
1. A Fornecedora concede ao Salão Parceiro uma licença limitada, revogável, intransferível e não exclusiva para utilizar as marcas, logotipos e materiais publicitários do Schönheitslokal exclusivamente para fins de marketing e distribuição dos produtos durante a vigência do contrato.
2. O Salão Parceiro compromete-se a preservar a imagem premium e a identidade visual da marca.

ARTIGO 5: VIGÊNCIA E RESCISÃO
1. Este contrato entra em vigor com a assinatura de ambas as partes e é válido pelo período de [ex: 12 meses]. Será renovado automaticamente por períodos iguais, a menos que uma das partes envie notificação de rescisão por escrito com antecedência mínima de [ex: 3 meses] via carta registrada.
2. O direito de rescisão imediata por justa causa (Art. 107 ss. CO) permanece garantido a qualquer momento, especialmente se uma das partes violar obrigações contratuais essenciais e não as sanar dentro de 15 dias após notificação por escrito.

ARTIGO 6: LEI APLICÁVEL E FORO
1. Este contrato é regido exclusivamente pela lei suíça (excluindo a Convenção de Vendas da ONU / CISG).
2. O foro exclusivo para todas as disputas decorrentes ou relacionadas a este contrato é Zurique, Suíça.

Zurique, em __________________
Pela Fornecedora (Schönheitslokal): Silvia Frick

Local/Data: __________________
Pelo Salão Parceiro: [Nome e Cargo do Representante]', 'Contrato de Parceria em Português')
ON CONFLICT (key) DO NOTHING;

-- 2. Criar tabelas partner_orders e partner_order_items
CREATE TABLE IF NOT EXISTS partner_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_total DECIMAL(10,2) NOT NULL CHECK (original_total >= 0),
    discount_pct DECIMAL(5,2) NOT NULL CHECK (discount_pct >= 0 AND discount_pct <= 100),
    discounted_total DECIMAL(10,2) NOT NULL CHECK (discounted_total >= 0),
    amount_upfront DECIMAL(10,2) NOT NULL CHECK (amount_upfront >= 0),
    amount_due_30_days DECIMAL(10,2) NOT NULL CHECK (amount_due_30_days >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_first', 'fully_paid', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'credit_card' CHECK (payment_method IN ('credit_card', 'boleto')),
    stripe_session_id_first TEXT,
    stripe_session_id_second TEXT,
    contract_accepted BOOLEAN DEFAULT FALSE,
    contract_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partner_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES partner_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0)
);

-- 3. Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para partner_orders
DROP POLICY IF EXISTS "Admins and owners can view all partner orders" ON partner_orders;
CREATE POLICY "Admins and owners can view all partner orders" ON partner_orders
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Admins and owners can manage all partner orders" ON partner_orders;
CREATE POLICY "Admins and owners can manage all partner orders" ON partner_orders
  FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Users can view their own partner orders" ON partner_orders;
CREATE POLICY "Users can view their own partner orders" ON partner_orders
  FOR SELECT USING (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert their own partner orders" ON partner_orders;
CREATE POLICY "Users can insert their own partner orders" ON partner_orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- 5. Criar políticas RLS para partner_order_items
DROP POLICY IF EXISTS "Admins and owners can view all partner order items" ON partner_order_items;
CREATE POLICY "Admins and owners can view all partner order items" ON partner_order_items
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Admins and owners can manage all partner order items" ON partner_order_items;
CREATE POLICY "Admins and owners can manage all partner order items" ON partner_order_items
  FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "Users can view their own partner order items" ON partner_order_items;
CREATE POLICY "Users can view their own partner order items" ON partner_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partner_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own partner order items" ON partner_order_items;
CREATE POLICY "Users can insert their own partner order items" ON partner_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- 6. Adicionar políticas para system_settings para permitir leitura a usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON system_settings;
CREATE POLICY "Authenticated users can view system settings" ON system_settings
  FOR SELECT TO authenticated USING (true);

-- 7. Conceder permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE ON partner_orders TO authenticated;
GRANT SELECT, INSERT ON partner_order_items TO authenticated;
