-- Add missing columns to agents table (Google Calendar, feature_config, Chatwoot integrations)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS feature_config JSONB DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS chatwoot_inbox_id INTEGER;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS chatwoot_website_token TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS chatwoot_instagram_inbox_id INTEGER;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
