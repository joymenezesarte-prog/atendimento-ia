-- ============================================================
-- MIGRATION 004: Sistema de Produtos e Pagamentos
-- ============================================================

-- Colunas de pagamento na tabela clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS mp_access_token TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;

-- Colunas de configuração de features e Chatwoot na tabela agents
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS feature_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chatwoot_inbox_id TEXT;

-- PRODUCTS (produtos/planos de cada cliente para venda via agente)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  payment_provider TEXT DEFAULT 'mercadopago' CHECK (payment_provider IN ('mercadopago', 'stripe')),
  payment_link TEXT,
  payment_preference_id TEXT,
  post_payment_action TEXT DEFAULT 'message' CHECK (post_payment_action IN ('message', 'file', 'schedule', 'whatsapp_group', 'email')),
  post_payment_content TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS (pedidos criados quando agente envia link personalizado a um lead)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  lead_phone TEXT NOT NULL,
  lead_name TEXT,
  payment_provider TEXT DEFAULT 'mercadopago',
  payment_link TEXT,
  payment_preference_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_own" ON products FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

CREATE POLICY "orders_own" ON orders FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_client ON products(client_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_lead_phone ON orders(lead_phone);
