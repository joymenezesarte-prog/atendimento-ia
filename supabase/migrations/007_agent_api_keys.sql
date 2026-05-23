-- ============================================================
-- MIGRATION 007: Chaves de API por agente
-- Permite que cada cliente configure suas próprias integrações
-- ============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

COMMENT ON COLUMN agents.resend_api_key IS 'Chave Resend do cliente para envio de emails de notificação';
COMMENT ON COLUMN agents.gemini_api_key IS 'Chave Gemini API do cliente para o agente IA';
