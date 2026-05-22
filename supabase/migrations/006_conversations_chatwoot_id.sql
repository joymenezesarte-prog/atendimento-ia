-- ============================================================
-- MIGRATION 006: Adiciona chatwoot_conv_id em conversations
-- Permite upsert idempotente pelo ID da conversa do Chatwoot
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS chatwoot_conv_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_chatwoot_id
  ON conversations(agent_id, chatwoot_conv_id)
  WHERE chatwoot_conv_id IS NOT NULL;

-- Também adiciona notification_email nos agents (para envio de email ao criar evento)
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS notification_email TEXT;
