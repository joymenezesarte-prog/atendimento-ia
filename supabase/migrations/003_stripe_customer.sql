-- ============================================================
-- MIGRATION 003: Adiciona campos de integração aos clientes
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
